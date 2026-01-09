import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
 * POST /api/sync
 *
 * Sync data using a sync token (for background/quiet syncing from CLI).
 * This endpoint authenticates via Bearer token instead of session cookies.
 */
export async function POST(request: Request) {
  try {
    // Extract sync token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const syncToken = authHeader.slice(7); // Remove "Bearer " prefix

    // Parse request body
    const body = await request.json();
    const data: TokenContributionData = body.data;

    // Validate required data
    if (!data || !data.contributions || !data.summary) {
      return NextResponse.json(
        { message: "Invalid data format: missing contributions or summary" },
        { status: 400 }
      );
    }

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
        { message: "Invalid or expired sync token" },
        { status: 401 }
      );
    }

    const userId = tokenRecord.user_id;

    // Process contributions (new format: TokenContributionData)
    const modelTokens: Record<string, number> = {};
    const toolTokens: Record<string, number> = {};

    for (const contribution of data.contributions) {
      // Aggregate daily activity by source (tool)
      for (const sourceData of contribution.sources) {
        const tool = sourceData.source;
        const totalTokens = sourceData.tokens.input + sourceData.tokens.output +
          sourceData.tokens.cacheRead + sourceData.tokens.cacheWrite + sourceData.tokens.reasoning;

        await serviceSupabase.from("daily_activity").upsert(
          {
            user_id: userId,
            date: contribution.date,
            tool: tool,
            message_count: sourceData.messages,
            session_count: 1, // Sessions not tracked in new format
            total_tokens: totalTokens,
          },
          {
            onConflict: "user_id,date,tool",
          }
        );

        // Insert token usage by model
        await serviceSupabase.from("token_usage").upsert(
          {
            user_id: userId,
            date: contribution.date,
            tool: tool,
            model: sourceData.modelId,
            input_tokens: sourceData.tokens.input,
            output_tokens: sourceData.tokens.output,
          },
          {
            onConflict: "user_id,date,tool,model",
          }
        );

        // Track for favorites calculation
        modelTokens[sourceData.modelId] = (modelTokens[sourceData.modelId] || 0) + totalTokens;
        toolTokens[tool] = (toolTokens[tool] || 0) + totalTokens;
      }
    }

    // Use summary from data
    const totalTokens = data.summary.totalTokens;
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

    // Calculate streak (simplified)
    const currentStreakDays = 1; // TODO: Calculate from daily_activity
    const longestStreakDays = 1;
    const longestSessionMs = 0; // Not tracked in new format

    // Upsert user stats
    await serviceSupabase.from("user_stats").upsert(
      {
        user_id: userId,
        total_tokens: totalTokens,
        total_sessions: totalSessions,
        favorite_model: favoriteModel,
        favorite_tool: favoriteTool,
        longest_session_ms: longestSessionMs,
        longest_streak_days: longestStreakDays,
        current_streak_days: currentStreakDays,
        first_activity_date: firstActivityDate,
        last_activity_date: lastActivityDate,
      },
      {
        onConflict: "user_id",
      }
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalTokens,
        totalSessions,
        favoriteModel,
      },
    });
  } catch (error) {
    console.error("Error syncing data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
