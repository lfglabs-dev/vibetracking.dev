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

export interface Config {
  syncToken?: string;
  userId?: string;
  lastSyncedAt?: string;
}
