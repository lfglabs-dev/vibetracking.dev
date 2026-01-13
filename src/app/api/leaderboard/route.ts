import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { estimateApiSpendUsd } from "@/lib/pricing";

interface UserData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface TeamMembership {
  team_id: string;
  teams: {
    github_org_login: string;
    name: string;
    is_public: boolean;
  };
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

    // Use anon client for public data (user stats, users)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Use service role for team data to bypass RLS (server-side only)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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
          avatar_url
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

    // Get all user IDs to fetch their team memberships
    const userIds = (leaderboard as unknown as LeaderboardRow[])
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

    // Transform data for response
    const transformed = (leaderboard as unknown as LeaderboardRow[])
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
          // Team info for clickable team tag
          teamSlug: teamInfo?.slug || null,
          teamName: teamInfo?.name || null,
          teamIsPublic: teamInfo?.isPublic || false,
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
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

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
