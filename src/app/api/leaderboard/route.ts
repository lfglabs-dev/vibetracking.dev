import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { estimateApiSpendUsd } from "@/lib/pricing";

interface UserData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  company: string | null;
}

interface LeaderboardRow {
  user_id: string;
  total_tokens: number;
  total_sessions: number;
  current_streak_days: number;
  favorite_model: string | null;
  users: UserData[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all"; // all, month, week
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get leaderboard with user stats
    const { data: leaderboard, error } = await supabase
      .from("user_stats")
      .select(
        `
        user_id,
        total_tokens,
        total_sessions,
        current_streak_days,
        favorite_model,
        users!inner (
          id,
          username,
          display_name,
          avatar_url,
          company
        )
      `
      )
      .order("total_tokens", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json(
        { message: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    // Transform data for response
    const transformed = (leaderboard as unknown as LeaderboardRow[]).map((entry, index) => {
      const user = entry.users[0]; // Supabase returns array even with !inner

      return {
        userId: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        company: user.company,
        totalTokens: entry.total_tokens,
        totalSessions: entry.total_sessions,
        currentStreak: entry.current_streak_days,
        favoriteModel: entry.favorite_model,
        estimatedSpend: estimateApiSpendUsd({
          model: entry.favorite_model,
          totalTokens: entry.total_tokens,
        }),
        profileUrl: `/@${user.username}`,
      };
    });

    const ranked = transformed
      .sort((a, b) => b.estimatedSpend - a.estimatedSpend)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return NextResponse.json({
      leaderboard: ranked,
      period,
    });
  } catch (error) {
    console.error("Error in leaderboard API:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
