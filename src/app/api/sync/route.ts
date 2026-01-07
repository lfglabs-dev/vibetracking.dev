import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ImportData, ToolData } from "@/lib/utils";

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
    const data: ImportData = body.data;

    if (!data || !data.tools) {
      return NextResponse.json(
        { message: "Invalid request body" },
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

    // Process import data (same logic as /api/import)
    const tools: ToolData[] = Object.values(data.tools).filter(
      (t): t is ToolData => t !== undefined && t !== null
    );

    // Aggregate daily activity across tools
    for (const tool of tools) {
      if (!tool) continue;

      for (const activity of tool.dailyActivity) {
        await serviceSupabase.from("daily_activity").upsert(
          {
            user_id: userId,
            date: activity.date,
            tool: tool.tool,
            message_count: activity.messageCount,
            session_count: activity.sessionCount,
            total_tokens: activity.totalTokens || 0,
          },
          {
            onConflict: "user_id,date,tool",
          }
        );
      }

      // Insert token usage by model
      for (const model of tool.modelUsage) {
        const today = new Date().toISOString().split("T")[0];

        await serviceSupabase.from("token_usage").insert({
          user_id: userId,
          date: today,
          tool: tool.tool,
          model: model.model,
          input_tokens: model.inputTokens,
          output_tokens: model.outputTokens,
        });
      }
    }

    // Calculate aggregate stats
    let totalTokens = 0;
    let totalSessions = 0;
    let longestSessionMs = 0;
    let firstActivityDate: string | null = null;
    let lastActivityDate: string | null = null;
    const modelTokens: Record<string, number> = {};
    const toolTokens: Record<string, number> = {};

    for (const tool of tools) {
      if (!tool) continue;

      totalTokens += tool.stats.totalTokens;
      totalSessions += tool.stats.totalSessions;
      toolTokens[tool.tool] = tool.stats.totalTokens;

      if (tool.stats.longestSessionMs > longestSessionMs) {
        longestSessionMs = tool.stats.longestSessionMs;
      }

      if (
        tool.stats.firstActivityDate &&
        (!firstActivityDate || tool.stats.firstActivityDate < firstActivityDate)
      ) {
        firstActivityDate = tool.stats.firstActivityDate;
      }

      if (
        tool.stats.lastActivityDate &&
        (!lastActivityDate || tool.stats.lastActivityDate > lastActivityDate)
      ) {
        lastActivityDate = tool.stats.lastActivityDate;
      }

      for (const model of tool.modelUsage) {
        const total =
          model.inputTokens +
          model.outputTokens +
          (model.cacheReadTokens || 0) +
          (model.cacheCreationTokens || 0);
        modelTokens[model.model] = (modelTokens[model.model] || 0) + total;
      }
    }

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
