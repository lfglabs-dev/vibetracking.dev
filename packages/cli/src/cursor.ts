/**
 * Cursor IDE Usage Data Import
 * Downloads usage CSV via browser and parses it for vibetracking
 *
 * Flow:
 * 1. Open browser to Cursor's CSV export URL (user already logged in)
 * 2. Wait for CSV to appear in Downloads folder
 * 3. If not found, prompt user to drag-and-drop the file
 * 4. Copy CSV to cache location for Rust module to parse
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as readline from "node:readline";
import { parse as parseCsv } from "csv-parse/sync";
import open from "open";
import pc from "picocolors";

// ============================================================================
// Types
// ============================================================================

export interface CursorUsageRow {
  date: string; // YYYY-MM-DD
  timestamp: number; // Unix milliseconds
  model: string;
  inputWithCacheWrite: number;
  inputWithoutCacheWrite: number;
  cacheRead: number;
  outputTokens: number;
  totalTokens: number;
  apiCost: number; // in USD
  costToYou: number; // in USD
}

export interface CursorUsageData {
  source: "cursor";
  model: string;
  providerId: string;
  messageCount: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
  cost: number;
}

export interface CursorMessageWithTimestamp {
  source: "cursor";
  model: string;
  providerId: string;
  timestamp: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
  cost: number;
}

export interface CursorUnifiedMessage {
  source: "cursor";
  modelId: string;
  providerId: string;
  sessionId: string;
  timestamp: number;
  date: string;
  tokens: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    reasoning: number;
  };
  cost: number;
}

export interface CursorSyncResult {
  synced: boolean;
  rows: number;
  skipped?: boolean;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CONFIG_DIR = path.join(os.homedir(), ".vibetracking");
const CURSOR_CACHE_DIR = path.join(CONFIG_DIR, "cursor-cache");
const CURSOR_CACHE_FILE = path.join(CURSOR_CACHE_DIR, "usage.csv");

// Date range for export: Jan 1, 2020 to now
const EXPORT_START_DATE = new Date("2020-01-01").getTime();

// Timeout for waiting for download (30 seconds)
const DOWNLOAD_TIMEOUT_MS = 30_000;

// Poll interval for checking downloads folder
const POLL_INTERVAL_MS = 1_000;

// ============================================================================
// Directory Helpers
// ============================================================================

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

function ensureCacheDir(): void {
  if (!fs.existsSync(CURSOR_CACHE_DIR)) {
    fs.mkdirSync(CURSOR_CACHE_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * Check if Cursor IDE is installed on this system
 */
export function isCursorInstalled(): boolean {
  const paths: string[] = [];

  if (process.platform === "darwin") {
    // macOS
    paths.push("/Applications/Cursor.app");
    paths.push(path.join(os.homedir(), "Applications", "Cursor.app"));
  } else if (process.platform === "linux") {
    // Linux - check desktop file
    paths.push(path.join(os.homedir(), ".local/share/applications/cursor.desktop"));
  } else if (process.platform === "win32") {
    // Windows - common install locations
    paths.push(path.join(process.env.LOCALAPPDATA || "", "Programs", "cursor", "Cursor.exe"));
    paths.push(path.join(process.env.PROGRAMFILES || "", "Cursor", "Cursor.exe"));
  }

  return paths.some((p) => fs.existsSync(p));
}

// ============================================================================
// Browser Download Flow
// ============================================================================

/**
 * Get common download folder paths for the current platform
 */
function getDownloadsFolders(): string[] {
  const home = os.homedir();
  const folders: string[] = [];

  if (process.platform === "darwin") {
    folders.push(path.join(home, "Downloads"));
  } else if (process.platform === "linux") {
    folders.push(path.join(home, "Downloads"));
    folders.push(path.join(home, "downloads")); // Some distros use lowercase
  } else if (process.platform === "win32") {
    // Windows Downloads folder
    const userProfile = process.env.USERPROFILE || home;
    folders.push(path.join(userProfile, "Downloads"));
  }

  // Filter to existing directories
  return folders.filter((f) => {
    try {
      return fs.existsSync(f) && fs.statSync(f).isDirectory();
    } catch {
      return false;
    }
  });
}

/**
 * Open browser to Cursor's CSV export page
 * The CSV will be downloaded automatically if user is logged in
 */
export async function openCursorExportPage(): Promise<void> {
  const endDate = Date.now();
  const startDate = EXPORT_START_DATE;
  const url = `https://cursor.com/api/dashboard/export-usage-events-csv?startDate=${startDate}&endDate=${endDate}&strategy=tokens`;
  await open(url);
}

/**
 * Find the most recent Cursor CSV file in download folders
 * that was modified after the given timestamp
 */
function findRecentCursorCsv(afterTimestamp: number): string | null {
  const folders = getDownloadsFolders();
  let mostRecent: { path: string; mtime: number } | null = null;

  for (const folder of folders) {
    try {
      const files = fs.readdirSync(folder);
      for (const file of files) {
        // Match Cursor's export filename pattern: usage-events-YYYY-MM-DD*.csv
        if (!file.startsWith("usage-events") || !file.endsWith(".csv")) {
          continue;
        }

        const filePath = path.join(folder, file);
        try {
          const stats = fs.statSync(filePath);
          const mtime = stats.mtimeMs;

          // File must be newer than when we opened the browser
          if (mtime > afterTimestamp) {
            if (!mostRecent || mtime > mostRecent.mtime) {
              mostRecent = { path: filePath, mtime };
            }
          }
        } catch {
          // Skip files we can't stat
        }
      }
    } catch {
      // Skip folders we can't read
    }
  }

  return mostRecent?.path ?? null;
}

/**
 * Wait for Cursor CSV to appear in downloads folder
 */
async function waitForCursorCsv(afterTimestamp: number, timeoutMs: number): Promise<string | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const found = findRecentCursorCsv(afterTimestamp);
    if (found) {
      return found;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return null;
}

/**
 * Prompt user to drag-and-drop the CSV file or skip
 */
async function promptForCsvPath(): Promise<string | null> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(pc.white("\n  Drag the downloaded CSV here (or press Enter to skip): "), (answer) => {
      rl.close();
      const trimmed = answer.trim();

      if (!trimmed) {
        resolve(null);
        return;
      }

      // Handle paths with quotes (drag-drop on some terminals)
      const cleanPath = trimmed.replace(/^["']|["']$/g, "").replace(/\\ /g, " ");

      // Validate file exists
      if (!fs.existsSync(cleanPath)) {
        console.log(pc.red(`  File not found: ${cleanPath}`));
        resolve(null);
        return;
      }

      // Validate it's a CSV file
      if (!cleanPath.toLowerCase().endsWith(".csv")) {
        console.log(pc.red("  File must be a CSV file"));
        resolve(null);
        return;
      }

      resolve(cleanPath);
    });
  });
}

/**
 * Validate that a file contains valid Cursor CSV data
 */
function validateCursorCsv(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Check for expected CSV header
    return content.startsWith("Date,");
  } catch {
    return false;
  }
}

/**
 * Sync Cursor usage data via browser download
 * Opens browser to download CSV, waits for it, copies to cache
 */
export async function syncCursorCache(): Promise<CursorSyncResult> {
  const beforeDownload = Date.now();

  console.log(pc.cyan("\n  Cursor detected! Opening browser to download your usage data..."));
  await openCursorExportPage();

  // Wait a moment for browser to open
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(pc.gray("  Waiting for download..."));

  // Wait for CSV to appear in downloads
  let csvPath = await waitForCursorCsv(beforeDownload, DOWNLOAD_TIMEOUT_MS);

  if (csvPath) {
    console.log(pc.green(`  Found: ${path.basename(csvPath)}`));
  } else {
    console.log(pc.yellow("  Download not detected automatically."));
    const userPath = await promptForCsvPath();

    if (!userPath) {
      console.log(pc.gray("  Skipping Cursor data."));
      return { synced: false, rows: 0, skipped: true };
    }
    csvPath = userPath;
  }

  // Validate the CSV
  if (!validateCursorCsv(csvPath)) {
    console.log(pc.red("  Invalid CSV file - doesn't look like Cursor export data."));
    return { synced: false, rows: 0, error: "Invalid CSV format" };
  }

  // Copy to cache location
  try {
    ensureConfigDir();
    ensureCacheDir();
    fs.copyFileSync(csvPath, CURSOR_CACHE_FILE);

    // Count rows for feedback
    const content = fs.readFileSync(CURSOR_CACHE_FILE, "utf-8");
    const rows = parseCursorCsv(content);
    console.log(pc.green(`  Imported ${rows.length} Cursor usage events.`));

    return { synced: true, rows: rows.length };
  } catch (error) {
    return { synced: false, rows: 0, error: (error as Error).message };
  }
}

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Parse cost string (e.g., "$0.50" or "0.50") to number
 */
function parseCost(costStr: string): number {
  if (!costStr) return 0;
  const cleaned = costStr.replace(/[$,]/g, "").trim();
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

/**
 * Infer provider from model name
 */
function inferProvider(model: string): string {
  const lowerModel = model.toLowerCase();

  if (lowerModel.includes("claude") || lowerModel.includes("sonnet") || lowerModel.includes("opus") || lowerModel.includes("haiku")) {
    return "anthropic";
  }
  if (lowerModel.includes("gpt") || lowerModel.includes("o1") || lowerModel.includes("o3")) {
    return "openai";
  }
  if (lowerModel.includes("gemini")) {
    return "google";
  }
  if (lowerModel.includes("deepseek")) {
    return "deepseek";
  }
  if (lowerModel.includes("llama") || lowerModel.includes("mixtral")) {
    return "meta";
  }

  return "cursor"; // Default provider
}

/**
 * Parse Cursor usage CSV into structured rows
 */
export function parseCursorCsv(csvText: string): CursorUsageRow[] {
  try {
    const records: Array<Record<string, string>> = parseCsv(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    return records
      .filter((record) => record["Date"] && record["Model"])
      .map((record) => {
        const dateStr = record["Date"] || "";
        const date = new Date(dateStr);
        const isValidDate = !isNaN(date.getTime());
        const dateOnly = isValidDate
          ? date.toISOString().slice(0, 10)
          : dateStr.length >= 10
            ? dateStr.slice(0, 10)
            : dateStr;

        return {
          date: dateOnly,
          timestamp: isValidDate ? date.getTime() : 0,
          model: (record["Model"] || "").trim(),
          inputWithCacheWrite: parseInt(record["Input (w/ Cache Write)"] || "0", 10),
          inputWithoutCacheWrite: parseInt(record["Input (w/o Cache Write)"] || "0", 10),
          cacheRead: parseInt(record["Cache Read"] || "0", 10),
          outputTokens: parseInt(record["Output Tokens"] || "0", 10),
          totalTokens: parseInt(record["Total Tokens"] || "0", 10),
          apiCost: parseCost(record["Cost"] || record["API Cost"] || "0"),
          costToYou: parseCost(record["Cost to you"] || "0"),
        };
      });
  } catch (error) {
    throw new Error(`Failed to parse Cursor CSV: ${(error as Error).message}`);
  }
}

// ============================================================================
// Data Aggregation (for table display)
// ============================================================================

/**
 * Aggregate Cursor usage by model
 */
export function aggregateCursorByModel(rows: CursorUsageRow[]): CursorUsageData[] {
  const modelMap = new Map<string, CursorUsageData>();

  for (const row of rows) {
    const key = row.model;
    const existing = modelMap.get(key);

    // Cache write = inputWithCacheWrite - inputWithoutCacheWrite (tokens written to cache)
    const cacheWrite = Math.max(0, row.inputWithCacheWrite - row.inputWithoutCacheWrite);
    // Input tokens (without cache) = inputWithoutCacheWrite
    const input = row.inputWithoutCacheWrite;

    if (existing) {
      existing.messageCount += 1;
      existing.input += input;
      existing.output += row.outputTokens;
      existing.cacheRead += row.cacheRead;
      existing.cacheWrite += cacheWrite;
      existing.cost += row.costToYou || row.apiCost;
    } else {
      modelMap.set(key, {
        source: "cursor",
        model: row.model,
        providerId: inferProvider(row.model),
        messageCount: 1,
        input,
        output: row.outputTokens,
        cacheRead: row.cacheRead,
        cacheWrite,
        reasoning: 0, // Cursor doesn't expose reasoning tokens
        cost: row.costToYou || row.apiCost,
      });
    }
  }

  return Array.from(modelMap.values()).sort((a, b) => b.cost - a.cost);
}

// ============================================================================
// Data Conversion (for graph/native module)
// ============================================================================

/**
 * Convert Cursor CSV rows to timestamped messages for graph generation
 */
export function cursorRowsToMessages(rows: CursorUsageRow[]): CursorMessageWithTimestamp[] {
  return rows.map((row) => {
    const cacheWrite = Math.max(0, row.inputWithCacheWrite - row.inputWithoutCacheWrite);
    const input = row.inputWithoutCacheWrite;

    return {
      source: "cursor" as const,
      model: row.model,
      providerId: inferProvider(row.model),
      timestamp: row.timestamp,
      input,
      output: row.outputTokens,
      cacheRead: row.cacheRead,
      cacheWrite,
      reasoning: 0,
      cost: row.costToYou || row.apiCost,
    };
  });
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Get the cache file path
 */
export function getCursorCachePath(): string {
  return CURSOR_CACHE_FILE;
}

/**
 * Check if cache exists and when it was last updated
 */
export function getCursorCacheStatus(): { exists: boolean; lastModified?: Date; path: string } {
  const exists = fs.existsSync(CURSOR_CACHE_FILE);
  let lastModified: Date | undefined;

  if (exists) {
    try {
      const stats = fs.statSync(CURSOR_CACHE_FILE);
      lastModified = stats.mtime;
    } catch {
      // Ignore stat errors
    }
  }

  return { exists, lastModified, path: CURSOR_CACHE_FILE };
}

/**
 * Read cached Cursor messages for Rust module integration
 */
export function readCursorMessagesFromCache(): CursorUnifiedMessage[] {
  if (!fs.existsSync(CURSOR_CACHE_FILE)) {
    return [];
  }

  try {
    const csvText = fs.readFileSync(CURSOR_CACHE_FILE, "utf-8");
    const rows = parseCursorCsv(csvText);

    return rows.map((row) => {
      const cacheWrite = Math.max(0, row.inputWithCacheWrite - row.inputWithoutCacheWrite);
      const input = row.inputWithoutCacheWrite;

      return {
        source: "cursor" as const,
        modelId: row.model,
        providerId: inferProvider(row.model),
        sessionId: `cursor-${row.date}-${row.model}`,
        timestamp: row.timestamp,
        date: row.date,
        tokens: {
          input,
          output: row.outputTokens,
          cacheRead: row.cacheRead,
          cacheWrite,
          reasoning: 0,
        },
        cost: row.costToYou || row.apiCost,
      };
    });
  } catch {
    return [];
  }
}
