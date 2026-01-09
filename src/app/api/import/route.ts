import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// New format from CLI (TokenContributionData)
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
    dateRange: { start: string; end: string };
  };
  summary: DataSummary;
  years: Array<{ year: string; totalTokens: number; totalCost: number; range: { start: string; end: string } }>;
  contributions: DailyContribution[];
}

/**
 * Normalize tool names to match database constraints
 */
function normalizeToolName(source: string): string {
  const toolMap: Record<string, string> = {
    opencode: "opencode",
    claude: "claude",
    codex: "codex",
    gemini: "gemini",
    cursor: "cursor",
    amp: "amp",
    droid: "droid",
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

export async function POST(request: Request) {
  try {
    const data: TokenContributionData & { company?: string } = await request.json();

    // Get authenticated user
    const supabase = await createServerClient();

    // Service role client for writes
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // GitHub authentication required
    if (!authUser) {
      return NextResponse.json(
        { message: "GitHub authentication required" },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    // Get username for profile URL and update company if provided
    const { data: userProfile } = await serviceSupabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .single();

    // Update company if provided
    if (data.company) {
      await serviceSupabase
        .from("users")
        .update({ company: data.company })
        .eq("id", userId);
    }

    const profileUrl = `/@${userProfile?.username || authUser.id}`;

    // Validate required data
    if (!data.contributions || !data.summary) {
      return NextResponse.json(
        { message: "Invalid data format: missing contributions or summary" },
        { status: 400 }
      );
    }

    // Process contributions (new format: TokenContributionData)
    const modelTokens: Record<string, number> = {};
    const toolTokens: Record<string, number> = {};

    for (const contribution of data.contributions) {
      // Aggregate sources by tool for daily_activity (multiple sources may have same tool)
      const toolTotals = new Map<string, {
        messageCount: number;
        tokens: number;
        cost: number;
      }>();

      for (const sourceData of contribution.sources) {
        const tool = normalizeToolName(sourceData.source);
        const totalTokens = sourceData.tokens.input + sourceData.tokens.output +
          sourceData.tokens.cacheRead + sourceData.tokens.cacheWrite + sourceData.tokens.reasoning;

        // Aggregate for daily_activity
        const existing = toolTotals.get(tool) || { messageCount: 0, tokens: 0, cost: 0 };
        toolTotals.set(tool, {
          messageCount: existing.messageCount + sourceData.messages,
          tokens: existing.tokens + totalTokens,
          cost: existing.cost + sourceData.cost,
        });

        // Insert token usage by model (use insert, not upsert - no unique constraint exists)
        const { error: usageError } = await serviceSupabase.from("token_usage").insert({
          user_id: userId,
          date: contribution.date,
          tool,
          model: sourceData.modelId,
          input_tokens: sourceData.tokens.input,
          output_tokens: sourceData.tokens.output,
          cache_read_tokens: sourceData.tokens.cacheRead,
          cache_creation_tokens: sourceData.tokens.cacheWrite,
          reasoning_tokens: sourceData.tokens.reasoning,
          cost: sourceData.cost,
        });

        if (usageError) {
          console.error("Error inserting token usage:", usageError);
        }

        // Track for favorites calculation
        modelTokens[sourceData.modelId] = (modelTokens[sourceData.modelId] || 0) + totalTokens;
        toolTokens[tool] = (toolTokens[tool] || 0) + totalTokens;
      }

      // Upsert daily activity for each tool (aggregated)
      for (const [tool, totals] of toolTotals) {
        const { error: activityError } = await serviceSupabase.from("daily_activity").upsert(
          {
            user_id: userId,
            date: contribution.date,
            tool,
            message_count: totals.messageCount,
            session_count: 1,
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

    // Use summary from data
    const totalTokens = data.summary.totalTokens;
    const totalCost = data.summary.totalCost;
    const totalSessions = data.summary.activeDays; // Use active days as proxy for sessions

    // Get date range from meta
    const firstActivityDate = data.meta?.dateRange?.start || null;
    const lastActivityDate = data.meta?.dateRange?.end || null;

    // Find favorite model and tool
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

    // Calculate streaks from active dates
    const activeDates = data.contributions
      .filter(c => c.totals.tokens > 0)
      .map(c => c.date)
      .sort();

    const { currentStreak, longestStreak } = calculateStreaks(activeDates);

    // Upsert user stats
    const { error: statsError } = await serviceSupabase.from("user_stats").upsert(
      {
        user_id: userId,
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_sessions: totalSessions,
        favorite_model: favoriteModel,
        favorite_tool: favoriteTool,
        longest_session_ms: 0,
        longest_streak_days: longestStreak,
        current_streak_days: currentStreak,
        first_activity_date: firstActivityDate,
        last_activity_date: lastActivityDate,
      },
      {
        onConflict: "user_id",
      }
    );

    if (statsError) {
      console.error("Error upserting user stats:", statsError);
    }

    // Generate sync token for CLI
    const syncToken = nanoid(32);
    await serviceSupabase.from("sync_tokens").insert({
      user_id: userId,
      token: syncToken,
    });

    return NextResponse.json({
      success: true,
      profileUrl,
      syncToken,
      stats: {
        totalTokens,
        totalCost,
        totalSessions,
        favoriteModel,
      },
    });
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
