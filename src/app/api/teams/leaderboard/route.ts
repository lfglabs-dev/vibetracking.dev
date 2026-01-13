import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface TeamLeaderboardEntry {
  rank: number;
  teamId: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  activeMemberCount: number;
  totalTokens: number;
  totalCost: number;
  totalSessions: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch teams with stats, ordered by total_cost
    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        id,
        github_org_login,
        name,
        avatar_url,
        team_stats (
          member_count,
          active_member_count,
          total_tokens,
          total_cost,
          total_sessions
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching teams:", error);
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: 500 }
      );
    }

    // Transform and sort by total_cost
    const leaderboard: TeamLeaderboardEntry[] = (teams || [])
      .map((team) => {
        const stats = Array.isArray(team.team_stats)
          ? team.team_stats[0]
          : team.team_stats;

        return {
          rank: 0, // Will be set after sorting
          teamId: team.id,
          slug: team.github_org_login,
          name: team.name,
          avatarUrl: team.avatar_url,
          memberCount: stats?.member_count || 0,
          activeMemberCount: stats?.active_member_count || 0,
          totalTokens: Number(stats?.total_tokens) || 0,
          totalCost: Number(stats?.total_cost) || 0,
          totalSessions: stats?.total_sessions || 0,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost)
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    return NextResponse.json({
      teams: leaderboard,
      totalTeams: leaderboard.length,
    });
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
