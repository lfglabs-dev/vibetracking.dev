import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import type { ImportData } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const data: ImportData & { company?: string } = await request.json();

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

    // Process import data
    const tools = Object.values(data.tools).filter(Boolean);

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

    // Calculate streak (simplified - could be more accurate)
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
