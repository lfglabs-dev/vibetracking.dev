import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { ToolData, DailyActivity, ModelUsage } from "../types.js";

interface CodexHistoryEntry {
  session_id: string;
  ts: number;
  text: string;
}

interface CodexSessionMeta {
  timestamp: string;
  type: "session_meta";
  payload: {
    id: string;
    timestamp: string;
    model_provider: string;
    cli_version: string;
  };
}

interface CodexTurnContext {
  timestamp: string;
  type: "turn_context";
  payload: {
    model: string;
  };
}

export async function parseCodex(): Promise<ToolData | null> {
  const codexDir = join(homedir(), ".codex");
  const sessionsDir = join(codexDir, "sessions");
  const historyPath = join(codexDir, "history.jsonl");

  if (!existsSync(sessionsDir)) {
    return null;
  }

  try {
    const dailyActivityMap = new Map<string, DailyActivity>();
    const modelUsageMap = new Map<
      string,
      { inputTokens: number; outputTokens: number }
    >();
    let totalSessions = 0;
    let totalMessages = 0;
    let longestSessionMs = 0;
    let firstDate: string | undefined;
    let lastDate: string | undefined;

    // Parse history.jsonl for session counts
    if (existsSync(historyPath)) {
      const historyContent = await readFile(historyPath, "utf-8");
      const sessions = new Set<string>();

      for (const line of historyContent.split("\n")) {
        if (!line.trim()) continue;
        try {
          const entry: CodexHistoryEntry = JSON.parse(line);
          sessions.add(entry.session_id);
          totalMessages++;
        } catch {
          // Skip invalid lines
        }
      }
      totalSessions = sessions.size;
    }

    // Parse session files for detailed data
    const years = await readdir(sessionsDir).catch(() => []);

    for (const year of years) {
      const yearPath = join(sessionsDir, year);
      const months = await readdir(yearPath).catch(() => []);

      for (const month of months) {
        const monthPath = join(yearPath, month);
        const days = await readdir(monthPath).catch(() => []);

        for (const day of days) {
          const dayPath = join(monthPath, day);
          const dateStr = `${year}-${month}-${day}`;
          const files = await readdir(dayPath).catch(() => []);

          let dayMessages = 0;
          let daySessions = 0;

          for (const file of files) {
            if (!file.endsWith(".jsonl")) continue;
            daySessions++;

            const filePath = join(dayPath, file);
            const content = await readFile(filePath, "utf-8");

            let sessionStart: number | undefined;
            let sessionEnd: number | undefined;

            for (const line of content.split("\n")) {
              if (!line.trim()) continue;
              try {
                const entry = JSON.parse(line);

                // Track session timing
                if (entry.timestamp) {
                  const ts = new Date(entry.timestamp).getTime();
                  if (!sessionStart || ts < sessionStart) sessionStart = ts;
                  if (!sessionEnd || ts > sessionEnd) sessionEnd = ts;
                }

                // Count messages
                if (entry.type === "event_msg") {
                  dayMessages++;
                }

                // Track model usage
                if (entry.type === "turn_context" && entry.payload?.model) {
                  const model = entry.payload.model;
                  if (!modelUsageMap.has(model)) {
                    modelUsageMap.set(model, { inputTokens: 0, outputTokens: 0 });
                  }
                  // Estimate tokens (we don't have exact counts)
                  const usage = modelUsageMap.get(model)!;
                  usage.inputTokens += 1000; // Rough estimate per turn
                  usage.outputTokens += 500;
                }
              } catch {
                // Skip invalid lines
              }
            }

            // Track longest session
            if (sessionStart && sessionEnd) {
              const duration = sessionEnd - sessionStart;
              if (duration > longestSessionMs) {
                longestSessionMs = duration;
              }
            }
          }

          // Aggregate daily activity
          if (daySessions > 0 || dayMessages > 0) {
            dailyActivityMap.set(dateStr, {
              date: dateStr,
              messageCount: dayMessages,
              sessionCount: daySessions,
              totalTokens: dayMessages * 1500, // Rough estimate
            });

            if (!firstDate || dateStr < firstDate) firstDate = dateStr;
            if (!lastDate || dateStr > lastDate) lastDate = dateStr;
          }
        }
      }
    }

    if (dailyActivityMap.size === 0) {
      return null;
    }

    // Convert to arrays
    const dailyActivity = Array.from(dailyActivityMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    const modelUsage: ModelUsage[] = Array.from(modelUsageMap.entries()).map(
      ([model, usage]) => ({
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      })
    );

    const totalTokens = modelUsage.reduce(
      (sum, m) => sum + m.inputTokens + m.outputTokens,
      0
    );

    return {
      tool: "codex",
      dailyActivity,
      modelUsage,
      stats: {
        totalTokens,
        totalSessions,
        totalMessages,
        longestSessionMs,
        firstActivityDate: firstDate,
        lastActivityDate: lastDate,
      },
    };
  } catch (error) {
    console.error("Error parsing Codex data:", error);
    return null;
  }
}
