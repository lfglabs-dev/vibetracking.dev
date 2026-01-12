/**
 * Shared type definitions for CLI import payloads.
 * Mirrors packages/cli/src/graph-types.ts.
 */

export type SourceType = "opencode" | "claude" | "codex" | "gemini" | "cursor" | "amp" | "droid";

export interface TokenBreakdown {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
}

export interface SourceContribution {
  source: SourceType;
  modelId: string;
  providerId?: string;
  tokens: TokenBreakdown;
  cost: number;
  messages: number;
}

export interface DailyContribution {
  date: string;
  totals: {
    tokens: number;
    cost: number;
    messages: number;
  };
  intensity: 0 | 1 | 2 | 3 | 4;
  tokenBreakdown: TokenBreakdown;
  sources: SourceContribution[];
}

export interface YearSummary {
  year: string;
  totalTokens: number;
  totalCost: number;
  range: {
    start: string;
    end: string;
  };
}

export interface DataSummary {
  totalTokens: number;
  totalCost: number;
  totalDays: number;
  activeDays: number;
  averagePerDay: number;
  maxCostInSingleDay: number;
  sources: SourceType[];
  models: string[];
}

export interface ExportMeta {
  generatedAt: string;
  version: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface TokenContributionData {
  meta: ExportMeta;
  summary: DataSummary;
  years: YearSummary[];
  contributions: DailyContribution[];
}
