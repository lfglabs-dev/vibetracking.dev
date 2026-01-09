import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * TokenContributionData format from the CLI
 * This matches the graph-types.ts from packages/cli
 */
interface TokenBreakdown {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
}

interface SourceContribution {
  source: string;
  modelId: string;
  providerId?: string;
  tokens: TokenBreakdown;
  cost: number;
  messages: number;
}

interface DailyContribution {
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

interface DataSummary {
  totalTokens: number;
  totalCost: number;
  totalDays: number;
  activeDays: number;
  averagePerDay: number;
  maxCostInSingleDay: number;
  sources: string[];
  models: string[];
}

interface TokenContributionData {
  meta: {
    generatedAt: string;
    version: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  summary: DataSummary;
  years: Array<{
    year: string;
    totalTokens: number;
    totalCost: number;
    range: { start: string; end: string };
  }>;
  contributions: DailyContribution[];
}

/**
 * POST /api/submit
 *
 * Submit token usage data from CLI.
 * Accepts TokenContributionData format (new CLI) or ImportData format (legacy).
 * Authentication via Bearer token.
 */
export async function POST(request: Request) {
  try {
    // Extract sync token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const syncToken = authHeader.slice(7); // Remove "Bearer " prefix

    // Parse request body
    const body = await request.json();

    // Service role client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate sync token and get user
    const { data: tokenRecord, error: tokenError } = await serviceSupabase
      .from("sync_tokens")
      .select("user_id")
      .eq("token", syncToken)
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired sync token" },
        { status: 401 }
      );
    }

    const userId = tokenRecord.user_id;

    // Check if it's TokenContributionData format (new CLI)
    if (body.meta && body.contributions && body.summary) {
      return handleTokenContributionData(serviceSupabase, userId, body as TokenContributionData);
    }

    // Legacy format not supported - return error
    return NextResponse.json(
      { error: "Invalid data format. Please update your CLI to the latest version." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error submitting data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle TokenContributionData format (new CLI)
 */
async function handleTokenContributionData(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  data: TokenContributionData
) {
  const submissionId = crypto.randomUUID();
  const warnings: string[] = [];

  // Process daily contributions
  for (const contribution of data.contributions) {
    // Aggregate sources by tool for daily_activity
    const toolTotals = new Map<string, {
      messageCount: number;
      tokens: number;
      cost: number;
    }>();

    for (const source of contribution.sources) {
      const tool = normalizeToolName(source.source);
      const existing = toolTotals.get(tool) || { messageCount: 0, tokens: 0, cost: 0 };
      const totalTokens = source.tokens.input + source.tokens.output +
        source.tokens.cacheRead + source.tokens.cacheWrite + source.tokens.reasoning;

      toolTotals.set(tool, {
        messageCount: existing.messageCount + source.messages,
        tokens: existing.tokens + totalTokens,
        cost: existing.cost + source.cost,
      });

      // Insert token usage by model
      const { error: usageError } = await supabase.from("token_usage").insert({
        user_id: userId,
        date: contribution.date,
        tool,
        model: source.modelId,
        input_tokens: source.tokens.input,
        output_tokens: source.tokens.output,
        cache_read_tokens: source.tokens.cacheRead,
        cache_creation_tokens: source.tokens.cacheWrite,
        reasoning_tokens: source.tokens.reasoning,
        cost: source.cost,
      });

      if (usageError) {
        console.error("Error inserting token usage:", usageError);
      }
    }

    // Upsert daily activity for each tool
    for (const [tool, totals] of toolTotals) {
      const { error: activityError } = await supabase.from("daily_activity").upsert(
        {
          user_id: userId,
          date: contribution.date,
          tool,
          message_count: totals.messageCount,
          session_count: 1, // Estimate - we don't have exact session count
          total_tokens: totals.tokens,
          cost: totals.cost,
        },
        {
          onConflict: "user_id,date,tool",
        }
      );

      if (activityError) {
        console.error("Error upserting daily activity:", activityError);
      }
    }
  }

  // Find favorite model and tool
  const modelTokens: Record<string, number> = {};
  const toolTokens: Record<string, number> = {};

  for (const contribution of data.contributions) {
    for (const source of contribution.sources) {
      const totalTokens = source.tokens.input + source.tokens.output +
        source.tokens.cacheRead + source.tokens.cacheWrite + source.tokens.reasoning;

      modelTokens[source.modelId] = (modelTokens[source.modelId] || 0) + totalTokens;
      toolTokens[source.source] = (toolTokens[source.source] || 0) + totalTokens;
    }
  }

  let favoriteModel: string | null = null;
  let maxModelTokens = 0;
  for (const [model, tokens] of Object.entries(modelTokens)) {
    if (tokens > maxModelTokens) {
      maxModelTokens = tokens;
      favoriteModel = model;
    }
  }

  let favoriteTool: string | null = null;
  let maxToolTokens = 0;
  for (const [tool, tokens] of Object.entries(toolTokens)) {
    if (tokens > maxToolTokens) {
      maxToolTokens = tokens;
      favoriteTool = tool;
    }
  }

  // Calculate streaks
  const activeDates = data.contributions
    .filter(c => c.totals.tokens > 0)
    .map(c => c.date)
    .sort();

  const { currentStreak, longestStreak } = calculateStreaks(activeDates);

  // Upsert user stats
  const { error: statsError } = await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      total_tokens: data.summary.totalTokens,
      total_cost: data.summary.totalCost,
      total_sessions: data.summary.activeDays, // Approximation
      favorite_model: favoriteModel,
      favorite_tool: favoriteTool,
      longest_streak_days: longestStreak,
      current_streak_days: currentStreak,
      first_activity_date: activeDates[0] || null,
      last_activity_date: activeDates[activeDates.length - 1] || null,
    },
    {
      onConflict: "user_id",
    }
  );

  if (statsError) {
    console.error("Error upserting user stats:", statsError);
  }

  // Get username for response
  const { data: userData } = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .single();

  return NextResponse.json({
    success: true,
    submissionId,
    username: userData?.username,
    metrics: {
      totalTokens: data.summary.totalTokens,
      totalCost: data.summary.totalCost,
      dateRange: data.meta.dateRange,
      activeDays: data.summary.activeDays,
      sources: data.summary.sources,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

/**
 * Normalize tool names from CLI format to database format
 */
function normalizeToolName(source: string): string {
  // Map CLI source names to database-compatible names
  const toolMap: Record<string, string> = {
    opencode: "opencode",
    claude: "claude",
    codex: "codex",
    gemini: "gemini",
    cursor: "cursor",
    amp: "amp",
    droid: "droid",
    // Legacy mappings
    claude_code: "claude_code",
  };

  return toolMap[source.toLowerCase()] || source.toLowerCase();
}

/**
 * Calculate current and longest streaks from sorted dates
 */
function calculateStreaks(sortedDates: string[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = new Date().toISOString().split("T")[0];
  let currentStreak = 0;
  let longestStreak = 1;
  let streak = 1;

  // Calculate current streak (from most recent date backwards)
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    if (i === sortedDates.length - 1) {
      const daysDiff = dateDiffDays(sortedDates[i], today);
      if (daysDiff <= 1) {
        currentStreak = 1;
      } else {
        break;
      }
    } else {
      const daysDiff = dateDiffDays(sortedDates[i], sortedDates[i + 1]);
      if (daysDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  for (let i = 1; i < sortedDates.length; i++) {
    const daysDiff = dateDiffDays(sortedDates[i - 1], sortedDates[i]);
    if (daysDiff === 1) {
      streak++;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  return { currentStreak, longestStreak };
}

function dateDiffDays(date1: string, date2: string): number {
  const d1 = new Date(date1 + "T00:00:00Z");
  const d2 = new Date(date2 + "T00:00:00Z");
  return Math.abs(Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}
