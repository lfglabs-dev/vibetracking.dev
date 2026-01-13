import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface TeamMember {
  githubUsername: string;
  isActive: boolean;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  stats: {
    totalTokens: number;
    totalCost: number;
    totalSessions: number;
    favoriteModel: string | null;
  } | null;
  githubStats: {
    contributions: number;
    commits: number;
    pullRequests: number;
  } | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id")
      .eq("github_org_login", slug)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get all memberships with user info
    const { data: memberships, error: membershipError } = await supabase
      .from("team_memberships")
      .select(`
        github_username,
        user_id,
        role,
        users (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("team_id", team.id);

    if (membershipError) {
      console.error("Error fetching memberships:", membershipError);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    // Get stats for active members
    const activeMemberIds = (memberships || [])
      .filter((m) => m.user_id !== null)
      .map((m) => m.user_id as string);

    let memberStats = new Map<string, {
      totalTokens: number;
      totalCost: number;
      totalSessions: number;
      favoriteModel: string | null;
    }>();

    if (activeMemberIds.length > 0) {
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("user_id, total_tokens, total_cost, total_sessions, favorite_model")
        .in("user_id", activeMemberIds);

      if (statsData) {
        for (const stat of statsData) {
          memberStats.set(stat.user_id, {
            totalTokens: Number(stat.total_tokens) || 0,
            totalCost: Number(stat.total_cost) || 0,
            totalSessions: stat.total_sessions || 0,
            favoriteModel: stat.favorite_model,
          });
        }
      }
    }

    // Transform to response format
    const members: TeamMember[] = (memberships || []).map((m) => {
      const user = Array.isArray(m.users) ? m.users[0] : m.users;
      const stats = m.user_id ? memberStats.get(m.user_id) || null : null;

      return {
        githubUsername: m.github_username,
        isActive: m.user_id !== null,
        userId: m.user_id,
        username: user?.username || null,
        displayName: user?.display_name || null,
        avatarUrl: user?.avatar_url || null,
        role: m.role || "member",
        stats,
        githubStats: null, // Will be populated client-side via GitHub API
      };
    });

    // Sort: active members first, then by tokens
    members.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return (b.stats?.totalTokens || 0) - (a.stats?.totalTokens || 0);
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
