import pako from "pako";

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

export function decodeImportData(encoded: string): ImportData | null {
  try {
    // Decode base64url
    const compressed = Buffer.from(encoded, "base64url");

    // Decompress
    const jsonString = pako.inflate(compressed, { to: "string" });

    // Parse JSON
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

// Types matching CLI
export interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount?: number;
  totalTokens?: number;
}

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

export interface SessionInfo {
  sessionId: string;
  durationMs: number;
  messageCount: number;
  startedAt: string;
}

export interface ToolData {
  tool: "claude_code" | "codex" | "cursor";
  dailyActivity: DailyActivity[];
  modelUsage: ModelUsage[];
  longestSession?: SessionInfo;
  stats: {
    totalTokens: number;
    totalSessions: number;
    totalMessages: number;
    longestSessionMs: number;
    firstActivityDate?: string;
    lastActivityDate?: string;
  };
  hourCounts?: Record<string, number>;
}

export interface ImportData {
  syncToken?: string;
  timestamp: number;
  version: number;
  tools: {
    claude_code?: ToolData;
    codex?: ToolData;
    cursor?: ToolData;
  };
}

export function getAggregatedStats(data: ImportData): {
  totalTokens: number;
  totalSessions: number;
  totalMessages: number;
  toolsFound: string[];
  favoriteModel: string | null;
  longestSessionMs: number;
} {
  let totalTokens = 0;
  let totalSessions = 0;
  let totalMessages = 0;
  let longestSessionMs = 0;
  const toolsFound: string[] = [];
  const modelTokens: Record<string, number> = {};

  for (const [toolName, toolData] of Object.entries(data.tools)) {
    if (toolData) {
      toolsFound.push(toolName);
      totalTokens += toolData.stats.totalTokens;
      totalSessions += toolData.stats.totalSessions;
      totalMessages += toolData.stats.totalMessages;

      if (toolData.stats.longestSessionMs > longestSessionMs) {
        longestSessionMs = toolData.stats.longestSessionMs;
      }

      // Aggregate model usage
      for (const model of toolData.modelUsage) {
        const total =
          model.inputTokens +
          model.outputTokens +
          (model.cacheReadTokens || 0) +
          (model.cacheCreationTokens || 0);
        modelTokens[model.model] = (modelTokens[model.model] || 0) + total;
      }
    }
  }

  // Find favorite model
  let favoriteModel: string | null = null;
  let maxTokens = 0;
  for (const [model, tokens] of Object.entries(modelTokens)) {
    if (tokens > maxTokens) {
      maxTokens = tokens;
      favoriteModel = model;
    }
  }

  return {
    totalTokens,
    totalSessions,
    totalMessages,
    toolsFound,
    favoriteModel,
    longestSessionMs,
  };
}
