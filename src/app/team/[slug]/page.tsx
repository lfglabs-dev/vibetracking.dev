import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TeamPage } from "@/components/team/TeamPage";
import { PrivateTeamPage } from "@/components/team/PrivateTeamPage";
import type { Metadata } from "next";

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: team } = await supabase
    .from("teams")
    .select("name, github_org_login, is_public")
    .eq("github_org_login", slug)
    .single();

  if (!team) {
    return {
      title: "Team Not Found | vibetracking",
    };
  }

  // Show team name for public teams, generic metadata for private
  if (team.is_public) {
    return {
      title: `${team.name} | vibetracking`,
      description: `${team.name}'s AI coding usage stats on vibetracking`,
    };
  }

  return {
    title: `Private Team | vibetracking`,
    description: `A private team on vibetracking`,
  };
}

export default async function TeamProfilePage({ params }: PageParams) {
  const { slug } = await params;

  // Service role client for data fetching (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get team with stats
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select(`
      id,
      github_org_login,
      name,
      avatar_url,
      description,
      created_by,
      is_public,
      team_stats (
        member_count,
        active_member_count,
        total_tokens,
        total_cost,
        total_sessions,
        favorite_model,
        favorite_tool
      )
    `)
    .eq("github_org_login", slug)
    .single();

  if (teamError || !team) {
    notFound();
  }

  // Check access: public teams are viewable by anyone, private teams need membership
  let hasAccess = team.is_public ?? false;
  let isAdmin = false;
  let currentUserId: string | null = null;

  // Get current user from server-side auth
  const authSupabase = await createServerClient();
  const { data: { user: authUser } } = await authSupabase.auth.getUser();
  currentUserId = authUser?.id || null;

  if (currentUserId) {
    // Check if user is team creator
    if (team.created_by === currentUserId) {
      hasAccess = true;
      isAdmin = true;
    } else {
      // Check if user is a team member
      const { data: membership } = await supabase
        .from("team_memberships")
        .select("id, role")
        .eq("team_id", team.id)
        .eq("user_id", currentUserId)
        .single();

      if (membership) {
        hasAccess = true;
        if (membership.role === "admin") {
          isAdmin = true;
        }
      }
    }
  }

  // Show private team page if no access (private team and not a member)
  if (!hasAccess) {
    return <PrivateTeamPage teamName={team.name} />;
  }

  // Get active member user IDs
  const { data: memberships } = await supabase
    .from("team_memberships")
    .select("user_id, github_username, role, users (id, username, display_name, avatar_url)")
    .eq("team_id", team.id);

  const activeMemberIds = (memberships || [])
    .filter((m) => m.user_id !== null)
    .map((m) => m.user_id as string);

  // Fetch daily activity, token usage, and member stats in parallel
  let dailyActivity: Array<{
    date: string;
    tool: string;
    totalTokens: number;
    cost: number;
  }> = [];

  let tokenUsage: Array<{
    date: string;
    model: string;
    tokens: number;
    cost: number;
  }> = [];

  let memberStats: Array<{
    userId: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    totalTokens: number;
    totalCost: number;
  }> = [];

  if (activeMemberIds.length > 0) {
    // Run all three queries in parallel
    const [activityResult, usageResult, statsResult] = await Promise.all([
      supabase
        .from("daily_activity")
        .select("date, tool, total_tokens, cost")
        .in("user_id", activeMemberIds)
        .order("date", { ascending: true }),
      supabase
        .from("token_usage")
        .select("date, model, input_tokens, output_tokens, cost")
        .in("user_id", activeMemberIds)
        .order("date", { ascending: true }),
      supabase
        .from("user_stats")
        .select("user_id, total_tokens, total_cost")
        .in("user_id", activeMemberIds),
    ]);

    // Process daily activity
    if (activityResult.data) {
      const activityMap = new Map<string, { totalTokens: number; cost: number }>();
      for (const row of activityResult.data) {
        const key = `${row.date}:${row.tool}`;
        const existing = activityMap.get(key);
        if (existing) {
          existing.totalTokens += Number(row.total_tokens) || 0;
          existing.cost += Number(row.cost) || 0;
        } else {
          activityMap.set(key, {
            totalTokens: Number(row.total_tokens) || 0,
            cost: Number(row.cost) || 0,
          });
        }
      }
      dailyActivity = Array.from(activityMap.entries()).map(([key, value]) => {
        const [date, tool] = key.split(":");
        return { date, tool, ...value };
      });
    }

    // Process token usage
    if (usageResult.data) {
      const usageMap = new Map<string, { tokens: number; cost: number }>();
      for (const row of usageResult.data) {
        const key = `${row.date}:${row.model}`;
        const totalTokens =
          (Number(row.input_tokens) || 0) + (Number(row.output_tokens) || 0);
        const existing = usageMap.get(key);
        if (existing) {
          existing.tokens += totalTokens;
          existing.cost += Number(row.cost) || 0;
        } else {
          usageMap.set(key, {
            tokens: totalTokens,
            cost: Number(row.cost) || 0,
          });
        }
      }
      tokenUsage = Array.from(usageMap.entries()).map(([key, value]) => {
        const [date, model] = key.split(":");
        return { date, model, ...value };
      });
    }

    // Process member stats
    if (statsResult.data) {
      const statsMap = new Map(statsResult.data.map((s) => [s.user_id, s]));
      memberStats = (memberships || [])
        .filter((m) => m.user_id && statsMap.has(m.user_id))
        .map((m) => {
          const stats = statsMap.get(m.user_id!)!;
          const user = Array.isArray(m.users) ? m.users[0] : m.users;
          return {
            userId: m.user_id!,
            username: user?.username || m.github_username,
            displayName: user?.display_name || null,
            avatarUrl: user?.avatar_url || null,
            totalTokens: Number(stats.total_tokens) || 0,
            totalCost: Number(stats.total_cost) || 0,
          };
        })
        .sort((a, b) => b.totalCost - a.totalCost);
    }
  }

  const teamStats = Array.isArray(team.team_stats)
    ? team.team_stats[0]
    : team.team_stats;

  return (
    <TeamPage
      team={{
        id: team.id,
        slug: team.github_org_login,
        name: team.name,
        avatarUrl: team.avatar_url,
        description: team.description,
        memberCount: teamStats?.member_count || 0,
        activeMemberCount: teamStats?.active_member_count || 0,
        isPublic: team.is_public ?? false,
      }}
      stats={{
        totalTokens: Number(teamStats?.total_tokens) || 0,
        totalCost: Number(teamStats?.total_cost) || 0,
        totalSessions: teamStats?.total_sessions || 0,
        favoriteModel: teamStats?.favorite_model || null,
        favoriteTool: teamStats?.favorite_tool || null,
      }}
      dailyActivity={dailyActivity}
      tokenUsage={tokenUsage}
      memberStats={memberStats}
      members={(memberships || []).map((m) => {
        const user = Array.isArray(m.users) ? m.users[0] : m.users;
        return {
          githubUsername: m.github_username,
          isActive: m.user_id !== null,
          username: user?.username || null,
          displayName: user?.display_name || null,
          avatarUrl: user?.avatar_url || null,
          role: m.role || "member",
        };
      })}
      isAdmin={isAdmin}
    />
  );
}
