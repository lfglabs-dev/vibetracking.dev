import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface UserData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface LeaderboardRow {
  user_id: string;
  total_tokens: number;
  total_sessions: number;
  total_cost: number;
  current_streak_days: number;
  favorite_model: string | null;
  users: UserData[];
}

interface DailyActivityRow {
  user_id: string;
  total_tokens: number;
  total_sessions: number;
  total_cost: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all"; // all, 30d, 7d
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Use anon client for public data (user stats, users)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Use service role for team data and aggregations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let leaderboard: LeaderboardRow[] = [];

    if (period === "all") {
      // All-time: use user_stats table
      const { data, error } = await supabase
        .from("user_stats")
        .select(
          `
          user_id,
          total_tokens,
          total_sessions,
          total_cost,
          current_streak_days,
          favorite_model,
          users!inner (
            id,
            username,
            display_name,
            avatar_url
          )
        `
        )
        .order("total_cost", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
          { message: "Failed to fetch leaderboard" },
          { status: 500 }
        );
      }
      leaderboard = data as unknown as LeaderboardRow[];
    } else {
      // Week or Month: aggregate from daily_activity
      const days = period === "7d" ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split("T")[0];

      // Use raw SQL for aggregation via service role
      const { data: aggregated, error: aggError } = await serviceSupabase.rpc(
        "get_leaderboard_by_period",
        { cutoff_date: cutoffStr, result_limit: limit }
      );

      if (aggError) {
        // Fallback: try direct query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await serviceSupabase
          .from("daily_activity")
          .select("user_id, total_tokens, session_count, cost")
          .gte("date", cutoffStr);

        if (fallbackError) {
          console.error("Error fetching daily activity:", fallbackError);
          return NextResponse.json(
            { message: "Failed to fetch leaderboard" },
            { status: 500 }
          );
        }

        // Manual aggregation
        const userAggregates = new Map<string, { tokens: number; sessions: number; cost: number }>();
        for (const row of fallbackData || []) {
          const existing = userAggregates.get(row.user_id) || { tokens: 0, sessions: 0, cost: 0 };
          userAggregates.set(row.user_id, {
            tokens: existing.tokens + (row.total_tokens || 0),
            sessions: existing.sessions + (row.session_count || 0),
            cost: existing.cost + parseFloat(row.cost || "0"),
          });
        }

        // Get user details
        const userIds = Array.from(userAggregates.keys());
        if (userIds.length === 0) {
          return NextResponse.json({ leaderboard: [], period });
        }

        const { data: users } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);

        const { data: stats } = await supabase
          .from("user_stats")
          .select("user_id, current_streak_days, favorite_model")
          .in("user_id", userIds);

        const statsMap = new Map(stats?.map((s) => [s.user_id, s]) || []);
        const usersMap = new Map(users?.map((u) => [u.id, u]) || []);

        leaderboard = Array.from(userAggregates.entries())
          .map(([userId, agg]) => {
            const user = usersMap.get(userId);
            const stat = statsMap.get(userId);
            if (!user) return null;
            return {
              user_id: userId,
              total_tokens: agg.tokens,
              total_sessions: agg.sessions,
              total_cost: agg.cost,
              current_streak_days: stat?.current_streak_days || 0,
              favorite_model: stat?.favorite_model || null,
              users: [user],
            };
          })
          .filter((x): x is LeaderboardRow => x !== null)
          .sort((a, b) => b.total_cost - a.total_cost)
          .slice(0, limit);
      } else {
        // RPC succeeded - transform the data
        const userIds = aggregated?.map((r: DailyActivityRow) => r.user_id) || [];
        if (userIds.length === 0) {
          return NextResponse.json({ leaderboard: [], period });
        }

        const { data: users } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);

        const { data: stats } = await supabase
          .from("user_stats")
          .select("user_id, current_streak_days, favorite_model")
          .in("user_id", userIds);

        const statsMap = new Map(stats?.map((s) => [s.user_id, s]) || []);
        const usersMap = new Map(users?.map((u) => [u.id, u]) || []);

        leaderboard = (aggregated || [])
          .map((row: DailyActivityRow) => {
            const user = usersMap.get(row.user_id);
            const stat = statsMap.get(row.user_id);
            if (!user) return null;
            return {
              user_id: row.user_id,
              total_tokens: row.total_tokens,
              total_sessions: row.total_sessions,
              total_cost: row.total_cost,
              current_streak_days: stat?.current_streak_days || 0,
              favorite_model: stat?.favorite_model || null,
              users: [user],
            };
          })
          .filter((x: LeaderboardRow | null): x is LeaderboardRow => x !== null);
      }
    }

    // Get all user IDs to fetch their team memberships
    const userIds = leaderboard
      .map((entry) => {
        const user = Array.isArray(entry.users) ? entry.users[0] : entry.users;
        return user?.id;
      })
      .filter((id): id is string => id !== undefined);

    // Fetch team memberships for all users, ordered by joined_at to get the first team consistently
    // Use service role to bypass RLS - we only expose public team data anyway
    const { data: memberships } = await serviceSupabase
      .from("team_memberships")
      .select(`
        user_id,
        joined_at,
        teams (
          github_org_login,
          name,
          is_public
        )
      `)
      .in("user_id", userIds)
      .order("joined_at", { ascending: true });

    // Create a map of user_id to team info (first team joined takes priority)
    const userTeamMap = new Map<string, { slug: string; name: string; isPublic: boolean }>();
    if (memberships) {
      for (const m of memberships) {
        if (m.user_id && m.teams) {
          // Skip if we already have a team for this user (keep the first one joined)
          if (userTeamMap.has(m.user_id)) continue;

          const team = Array.isArray(m.teams) ? m.teams[0] : m.teams;
          if (team) {
            userTeamMap.set(m.user_id, {
              slug: team.github_org_login,
              name: team.name,
              isPublic: team.is_public ?? false,
            });
          }
        }
      }
    }

    // Transform data for response - use total_cost directly
    const transformed = leaderboard
      .map((entry) => {
        // Supabase !inner join returns a single object, not an array
        const user = Array.isArray(entry.users) ? entry.users[0] : entry.users;
        if (!user) return null;

        const teamInfo = userTeamMap.get(user.id);

        return {
          userId: user.id,
          username: user.username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          teamSlug: teamInfo?.slug || null,
          teamName: teamInfo?.name || null,
          teamIsPublic: teamInfo?.isPublic || false,
          totalTokens: entry.total_tokens,
          totalSessions: entry.total_sessions,
          currentStreak: entry.current_streak_days,
          favoriteModel: entry.favorite_model,
          estimatedSpend: entry.total_cost,
          profileUrl: `/@${user.username}`,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    // Data is already sorted by total_cost, just add ranks
    const ranked = transformed.map((entry, index) => ({
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
