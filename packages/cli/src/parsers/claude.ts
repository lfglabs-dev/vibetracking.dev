import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { ToolData, DailyActivity, ModelUsage } from "../types.js";

interface ClaudeStatsCache {
  version: number;
  lastComputedDate: string;
  dailyActivity: Array<{
    date: string;
    messageCount: number;
    sessionCount: number;
    toolCallCount: number;
  }>;
  dailyModelTokens: Array<{
    date: string;
    tokensByModel: Record<string, number>;
  }>;
  modelUsage: Record<
    string,
    {
      inputTokens: number;
      outputTokens: number;
      cacheReadInputTokens: number;
      cacheCreationInputTokens: number;
      webSearchRequests: number;
      costUSD: number;
      contextWindow: number;
    }
  >;
  totalSessions: number;
  totalMessages: number;
  longestSession: {
    sessionId: string;
    duration: number;
    messageCount: number;
    timestamp: string;
  };
  firstSessionDate: string;
  hourCounts: Record<string, number>;
}

export async function parseClaudeCode(): Promise<ToolData | null> {
  const claudeDir = join(homedir(), ".claude");
  const statsCachePath = join(claudeDir, "stats-cache.json");

  if (!existsSync(statsCachePath)) {
    return null;
  }

  try {
    const content = await readFile(statsCachePath, "utf-8");
    const stats: ClaudeStatsCache = JSON.parse(content);

    // Convert daily activity
    const dailyActivity: DailyActivity[] = stats.dailyActivity.map((day) => {
      // Find tokens for this day
      const dayTokens = stats.dailyModelTokens.find((d) => d.date === day.date);
      const totalTokens = dayTokens
        ? Object.values(dayTokens.tokensByModel).reduce((a, b) => a + b, 0)
        : 0;

      return {
        date: day.date,
        messageCount: day.messageCount,
        sessionCount: day.sessionCount,
        toolCallCount: day.toolCallCount,
        totalTokens,
      };
    });

    // Convert model usage
    const modelUsage: ModelUsage[] = Object.entries(stats.modelUsage).map(
      ([model, usage]) => ({
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadInputTokens,
        cacheCreationTokens: usage.cacheCreationInputTokens,
      })
    );

    // Calculate total tokens
    const totalTokens = modelUsage.reduce(
      (sum, m) =>
        sum +
        m.inputTokens +
        m.outputTokens +
        (m.cacheReadTokens || 0) +
        (m.cacheCreationTokens || 0),
      0
    );

    // Get date range
    const dates = dailyActivity.map((d) => d.date).sort();
    const firstActivityDate = dates[0];
    const lastActivityDate = dates[dates.length - 1];

    return {
      tool: "claude_code",
      dailyActivity,
      modelUsage,
      longestSession: stats.longestSession
        ? {
            sessionId: stats.longestSession.sessionId,
            durationMs: stats.longestSession.duration,
            messageCount: stats.longestSession.messageCount,
            startedAt: stats.longestSession.timestamp,
          }
        : undefined,
      stats: {
        totalTokens,
        totalSessions: stats.totalSessions,
        totalMessages: stats.totalMessages,
        longestSessionMs: stats.longestSession?.duration || 0,
        firstActivityDate,
        lastActivityDate,
      },
      hourCounts: stats.hourCounts,
    };
  } catch (error) {
    console.error("Error parsing Claude Code data:", error);
    return null;
  }
}
