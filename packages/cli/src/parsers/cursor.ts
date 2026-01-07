import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { parse } from "csv-parse/sync";
import type { ToolData, DailyActivity, ModelUsage } from "../types.js";

// CSV columns from Cursor export (actual format from cursor.com dashboard)
interface CursorCSVRecord {
  // Actual column names from Cursor export
  Date?: string;
  Kind?: string;
  Model?: string;
  "Max Mode"?: string;
  "Input (w/ Cache Write)"?: string;
  "Input (w/o Cache Write)"?: string;
  "Cache Read"?: string;
  "Output Tokens"?: string;
  "Total Tokens"?: string;
  Cost?: string;
  // Legacy column names (for compatibility)
  timestamp?: string;
  model?: string;
  kind?: string;
  inputTokens?: string;
  outputTokens?: string;
  cacheWriteTokens?: string;
  cacheReadTokens?: string;
  totalCents?: string;
}

/**
 * Generate the Cursor export URL with date range
 */
export function getCursorExportUrl(): string {
  const now = Date.now();
  const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;

  return `https://cursor.com/api/dashboard/export-usage-events-csv?startDate=${twoYearsAgo}&endDate=${now}&strategy=tokens`;
}

/**
 * Check if Cursor is installed on this machine
 */
export function isCursorInstalled(): boolean {
  const platform = process.platform;

  let cursorDir: string;
  if (platform === "darwin") {
    cursorDir = join(homedir(), "Library", "Application Support", "Cursor");
  } else if (platform === "win32") {
    cursorDir = join(
      process.env.APPDATA || join(homedir(), "AppData", "Roaming"),
      "Cursor"
    );
  } else {
    cursorDir = join(homedir(), ".config", "Cursor");
  }

  return existsSync(cursorDir);
}

/**
 * Wait for a new CSV file to appear in the Downloads folder
 */
export async function waitForCursorCSV(
  timeoutMs: number = 30000
): Promise<string | null> {
  const downloadsDir = join(homedir(), "Downloads");

  if (!existsSync(downloadsDir)) {
    return null;
  }

  const startTime = Date.now();

  // Get initial file list
  const initialFiles = new Set(await readdir(downloadsDir));

  // Poll for new CSV file
  while (Date.now() - startTime < timeoutMs) {
    const currentFiles = await readdir(downloadsDir);

    for (const file of currentFiles) {
      // Look for new CSV files that weren't there before
      if (!initialFiles.has(file) && file.toLowerCase().endsWith(".csv")) {
        // Wait a moment to ensure file is fully written
        await new Promise((resolve) => setTimeout(resolve, 500));
        return join(downloadsDir, file);
      }
    }

    // Check every second
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return null;
}

/**
 * Parse a Cursor usage CSV file and convert to ToolData format
 */
export async function parseCursorCSV(csvPath: string): Promise<ToolData | null> {
  if (!existsSync(csvPath)) {
    return null;
  }

  try {
    const content = await readFile(csvPath, "utf-8");

    // Parse CSV with headers
    const records: CursorCSVRecord[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (records.length === 0) {
      return null;
    }

    // Aggregate by day and model
    const dailyMap = new Map<
      string,
      {
        messageCount: number;
        sessionCount: number;
        totalTokens: number;
      }
    >();
    const modelMap = new Map<
      string,
      {
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheCreationTokens: number;
      }
    >();

    let totalTokens = 0;
    let totalMessages = 0;
    let firstDate: string | undefined;
    let lastDate: string | undefined;

    for (const record of records) {
      // Extract date from timestamp (handle both "Date" and "timestamp" columns)
      const date = extractDate(record.Date || record.timestamp);
      if (!date) continue;

      // Get token counts (handle actual Cursor export format and legacy formats)
      // Cursor uses "Input (w/ Cache Write)" which includes cache write tokens
      // and "Input (w/o Cache Write)" which is the raw input tokens
      const inputWithCacheWrite = parseInt(
        record["Input (w/ Cache Write)"] || "0",
        10
      );
      const inputWithoutCacheWrite = parseInt(
        record["Input (w/o Cache Write)"] || record.inputTokens || "0",
        10
      );
      const outputTokens = parseInt(
        record["Output Tokens"] || record.outputTokens || "0",
        10
      );
      const cacheReadTokens = parseInt(
        record["Cache Read"] || record.cacheReadTokens || "0",
        10
      );
      // Cache write is the difference between input with and without cache write
      const cacheWriteTokens = inputWithCacheWrite - inputWithoutCacheWrite;
      // Use the actual input tokens (without cache write already counted)
      const inputTokens = inputWithoutCacheWrite;

      const recordTokens =
        inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens;

      // Update daily activity
      const daily = dailyMap.get(date) || {
        messageCount: 0,
        sessionCount: 0,
        totalTokens: 0,
      };
      daily.messageCount += 1;
      daily.totalTokens += recordTokens;
      dailyMap.set(date, daily);

      // Update model usage (handle both "Model" and "model" columns)
      const model = record.Model || record.model || "unknown";
      const modelUsage = modelMap.get(model) || {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      };
      modelUsage.inputTokens += inputTokens;
      modelUsage.outputTokens += outputTokens;
      modelUsage.cacheReadTokens += cacheReadTokens;
      modelUsage.cacheCreationTokens += cacheWriteTokens;
      modelMap.set(model, modelUsage);

      // Track totals
      totalTokens += recordTokens;
      totalMessages += 1;

      // Track date range
      if (!firstDate || date < firstDate) firstDate = date;
      if (!lastDate || date > lastDate) lastDate = date;
    }

    // Estimate session count (1 session per day with activity)
    const totalSessions = dailyMap.size;

    // Update session counts in daily activity
    for (const [date, activity] of dailyMap) {
      activity.sessionCount = 1; // At least 1 session per day
    }

    // Convert to arrays
    const dailyActivity: DailyActivity[] = Array.from(dailyMap.entries())
      .map(([date, activity]) => ({
        date,
        messageCount: activity.messageCount,
        sessionCount: activity.sessionCount,
        totalTokens: activity.totalTokens,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const modelUsage: ModelUsage[] = Array.from(modelMap.entries()).map(
      ([model, usage]) => ({
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadTokens,
        cacheCreationTokens: usage.cacheCreationTokens,
      })
    );

    return {
      tool: "cursor",
      dailyActivity,
      modelUsage,
      stats: {
        totalTokens,
        totalSessions,
        totalMessages,
        longestSessionMs: 0, // Not available in CSV
        firstActivityDate: firstDate,
        lastActivityDate: lastDate,
      },
    };
  } catch (error) {
    console.error("Error parsing Cursor CSV:", error);
    return null;
  }
}

/**
 * Extract date (YYYY-MM-DD) from timestamp string
 */
function extractDate(timestamp: string): string | null {
  if (!timestamp) return null;

  try {
    // Handle ISO format: 2025-12-31T12:34:56Z
    // Handle Unix timestamp (ms): 1735689600000
    let date: Date;

    if (/^\d+$/.test(timestamp)) {
      // Unix timestamp in milliseconds
      date = new Date(parseInt(timestamp, 10));
    } else {
      // ISO or other string format
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      return null;
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

/**
 * Legacy function - kept for compatibility but now returns null
 * Use parseCursorCSV for actual data parsing
 */
export async function parseCursor(): Promise<ToolData | null> {
  // This function now returns null - Cursor data is parsed via CSV export
  // The CLI will handle the interactive flow for Cursor
  return null;
}
