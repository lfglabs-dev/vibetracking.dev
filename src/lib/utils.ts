import pako from "pako";
import type { TokenContributionData } from "@/lib/graph-types";

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

export function decodeImportData(encoded: string): TokenContributionData | null {
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

export type ImportData = TokenContributionData;

// Fun fact metrics calculation utilities
// Constants for calculations - RESEARCH-BASED estimates
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

// Research-based constants for time estimation:
// - Studies show developers write ~10-80 LOC/day of production code
// - 50 LOC/day is a commonly cited benchmark for quality production code
// - Working 8 hours/day = 480 minutes
// - Time per line = 480 / 50 = 9.6 minutes
// Sources: IEEE studies, StackOverflow surveys, industry benchmarks
const HUMAN_LINES_PER_DAY = 50; // Production-quality lines per 8-hour day
const MINUTES_PER_LINE = 9.6; // 480 minutes / 50 lines

export interface FunFactMetrics {
  salarySaved: number; // Amount saved in USD
  linesOfCode: number; // Lines of code equivalent
  productivityBoostPercent: number; // Percentage more code written vs pre-AI coder
}

/**
 * Calculate salary savings based on AI-generated lines of code
 * Logic:
 * 1. Calculate effective code tokens (~0.1% of total due to cache inflation)
 * 2. Convert to lines of code (15 tokens per line)
 * 3. Estimate time saved using research benchmark: 9.6 minutes per line
 *    (Based on 50 LOC/day in 8 hours for production-quality code)
 * 4. Convert time to dollar value using hourly rate
 * 5. Subtract API cost for net savings
 */
export function calculateSalarySaved(totalTokens: number, estimatedApiSpend: number): number {
  // Only ~0.1% of tokens represent actual code output (due to cache inflation)
  const effectiveCodeTokens = totalTokens * EFFECTIVE_CODE_FRACTION;

  // Convert to lines of code
  const linesOfCode = effectiveCodeTokens / TOKENS_PER_LINE_OF_CODE;

  // Calculate hours saved based on research: 9.6 minutes per line
  const minutesSaved = linesOfCode * MINUTES_PER_LINE;
  const hoursSaved = minutesSaved / 60;

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
 * Based on research: developers write ~50 LOC/day of production code without AI
 */
export function calculateProductivityBoostPercent(totalTokens: number, activeDays: number): number {
  if (activeDays === 0) return 0;

  // Only count effective code tokens (~0.1%)
  const effectiveCodeTokens = totalTokens * EFFECTIVE_CODE_FRACTION;

  // Calculate AI-assisted lines per day
  const aiLinesPerDay = (effectiveCodeTokens / TOKENS_PER_LINE_OF_CODE) / activeDays;

  // Calculate how much AI adds on top of human baseline (as percentage)
  // e.g., if AI generates 50 lines/day and human baseline is 50, that's 100% boost
  return Math.max(0, (aiLinesPerDay / HUMAN_LINES_PER_DAY) * 100);
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
  const totalTokens = data.summary?.totalTokens ?? 0;
  const totalSessions = data.summary?.activeDays ?? 0;
  let totalMessages = 0;
  const toolsFound = Array.from(new Set(data.summary?.sources ?? []));
  const modelTokens: Record<string, number> = {};

  for (const contribution of data.contributions ?? []) {
    totalMessages += contribution.totals?.messages ?? 0;
    for (const source of contribution.sources ?? []) {
      const total =
        source.tokens.input +
        source.tokens.output +
        source.tokens.cacheRead +
        source.tokens.cacheWrite +
        source.tokens.reasoning;
      modelTokens[source.modelId] = (modelTokens[source.modelId] || 0) + total;
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
    longestSessionMs: 0,
  };
}
