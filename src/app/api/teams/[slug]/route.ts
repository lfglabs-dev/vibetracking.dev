import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface TeamResponse {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  description: string | null;
  memberCount: number;
  activeMemberCount: number;
  stats: {
    totalTokens: number;
    totalCost: number;
    totalSessions: number;
    favoriteModel: string | null;
    favoriteTool: string | null;
  };
  dailyActivity: Array<{
    date: string;
    tool: string;
    totalTokens: number;
    cost: number;
  }>;
  tokenUsage: Array<{
    date: string;
    model: string;
    tokens: number;
    cost: number;
  }>;
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

    // Fetch team with stats
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select(`
        id,
        github_org_login,
        name,
        avatar_url,
        description,
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
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get active member user IDs
    const { data: memberships } = await supabase
      .from("team_memberships")
      .select("user_id")
      .eq("team_id", team.id)
      .not("user_id", "is", null);

    const activeMemberIds = (memberships || [])
      .map((m) => m.user_id)
      .filter((id): id is string => id !== null);

    // Aggregate daily activity for all team members
    let dailyActivity: TeamResponse["dailyActivity"] = [];
    let tokenUsage: TeamResponse["tokenUsage"] = [];

    if (activeMemberIds.length > 0) {
      // Get daily activity aggregated by date and tool
      const { data: activityData } = await supabase
        .from("daily_activity")
        .select("date, tool, total_tokens, cost")
        .in("user_id", activeMemberIds)
        .order("date", { ascending: true });

      if (activityData) {
        // Aggregate by date+tool
        const activityMap = new Map<string, { totalTokens: number; cost: number }>();
        for (const row of activityData) {
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

      // Get token usage aggregated by date and model
      const { data: usageData } = await supabase
        .from("token_usage")
        .select("date, model, input_tokens, output_tokens, cost")
        .in("user_id", activeMemberIds)
        .order("date", { ascending: true });

      if (usageData) {
        // Aggregate by date+model
        const usageMap = new Map<string, { tokens: number; cost: number }>();
        for (const row of usageData) {
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
    }

    const teamStats = Array.isArray(team.team_stats)
      ? team.team_stats[0]
      : team.team_stats;

    const response: TeamResponse = {
      id: team.id,
      slug: team.github_org_login,
      name: team.name,
      avatarUrl: team.avatar_url,
      description: team.description,
      memberCount: teamStats?.member_count || 0,
      activeMemberCount: teamStats?.active_member_count || 0,
      stats: {
        totalTokens: Number(teamStats?.total_tokens) || 0,
        totalCost: Number(teamStats?.total_cost) || 0,
        totalSessions: teamStats?.total_sessions || 0,
        favoriteModel: teamStats?.favorite_model || null,
        favoriteTool: teamStats?.favorite_tool || null,
      },
      dailyActivity,
      tokenUsage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
