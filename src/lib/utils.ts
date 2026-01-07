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

const standardCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "$0.00";
  }

  if (amount >= 1000) {
    return compactCurrencyFormatter.format(amount);
  }

  return standardCurrencyFormatter.format(amount);
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

// Helper to decode base64url in browser (no Buffer dependency)
function base64urlToUint8Array(base64url: string): Uint8Array {
  // Convert base64url to base64
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }

  // Decode base64 to binary string
  const binaryString = atob(base64);

  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

export function decodeImportData(encoded: string): ImportData | null {
  try {
    // Decode base64url to Uint8Array (works in both browser and Node.js)
    const compressed = base64urlToUint8Array(encoded);

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

// Fun fact metrics calculation utilities
// Constants for calculations - REVISED for realistic estimates
//
// Key insight: Total tokens include massive cache read/creation tokens
// - Cache tokens can be 100x larger than actual input/output tokens
// - Only ~0.2-0.5% of total tokens are actual new output
// - Of that output, only ~30% is actual code (rest is explanations)
// - Effective code fraction: ~0.1-0.15% of total tokens
//
const EFFECTIVE_CODE_FRACTION = 0.001; // ~0.1% of total tokens → actual code lines

const AVERAGE_YEARLY_DEV_SALARY = 130_000; // USD
const TOKENS_PER_LINE_OF_CODE = 15; // Conservative: avg line ~60 chars = ~15 tokens
// Conservative estimate: good devs write ~50-100 meaningful lines/day pre-AI
const AVERAGE_HUMAN_LINES_PER_DAY = 75;
// Estimate: 1000 code tokens saves ~10 min of work (writing, debugging, testing)
const HOURS_SAVED_PER_1000_CODE_TOKENS = 0.15;

export interface FunFactMetrics {
  salarySaved: number; // Amount saved in USD
  linesOfCode: number; // Lines of code equivalent
  productivityBoostPercent: number; // Percentage more code written vs pre-AI coder
}

/**
 * Calculate salary savings based on estimated API spend
 * Logic: Only count effective code tokens (~0.1% of total), then estimate hours saved
 * Savings = value of hours saved - API cost
 */
export function calculateSalarySaved(totalTokens: number, estimatedApiSpend: number): number {
  // Only ~0.1% of tokens represent actual code output (due to cache inflation)
  const effectiveCodeTokens = totalTokens * EFFECTIVE_CODE_FRACTION;

  // Estimate hours saved (1000 code tokens ≈ 30 min saved)
  const hoursSaved = (effectiveCodeTokens / 1000) * HOURS_SAVED_PER_1000_CODE_TOKENS;

  // Hourly rate from yearly salary (assuming 2000 working hours/year)
  const hourlyRate = AVERAGE_YEARLY_DEV_SALARY / 2000; // $65/hour

  // Value of hours saved
  const valueSaved = hoursSaved * hourlyRate;

  // Net savings = value saved - API cost
  return Math.max(0, valueSaved - estimatedApiSpend);
}

/**
 * Calculate equivalent lines of code
 * Logic: Only count effective code tokens (~0.1%), then convert to lines (~15 tokens per line)
 */
export function calculateLinesOfCode(totalTokens: number): number {
  const effectiveCodeTokens = totalTokens * EFFECTIVE_CODE_FRACTION;
  return Math.round(effectiveCodeTokens / TOKENS_PER_LINE_OF_CODE);
}

/**
 * Calculate productivity boost percentage
 * Logic: Compare AI-assisted daily code output to average human coder pre-AI
 * Returns percentage increase (e.g., 100 means you produce 100% more code = 2x)
 */
export function calculateProductivityBoostPercent(totalTokens: number, activeDays: number): number {
  if (activeDays === 0) return 0;

  // Only count effective code tokens (~0.1%)
  const effectiveCodeTokens = totalTokens * EFFECTIVE_CODE_FRACTION;

  // Calculate AI-assisted lines per day
  const aiLinesPerDay = (effectiveCodeTokens / TOKENS_PER_LINE_OF_CODE) / activeDays;

  // Calculate how much AI adds on top of human baseline (as percentage)
  // e.g., if AI generates 50 lines/day and human baseline is 50, that's 100% boost
  return Math.max(0, (aiLinesPerDay / AVERAGE_HUMAN_LINES_PER_DAY) * 100);
}

/**
 * Calculate all fun fact metrics
 */
export function calculateFunFactMetrics(
  totalTokens: number,
  estimatedApiSpend: number,
  activeDays: number
): FunFactMetrics {
  return {
    salarySaved: calculateSalarySaved(totalTokens, estimatedApiSpend),
    linesOfCode: calculateLinesOfCode(totalTokens),
    productivityBoostPercent: calculateProductivityBoostPercent(totalTokens, activeDays),
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
