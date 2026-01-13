import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { fetchAllOrgMembersWithUserToken } from "@/lib/github-org";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Get authenticated user
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's GitHub access token from session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.provider_token;
    if (!accessToken) {
      return NextResponse.json(
        { error: "GitHub access token not available. Please re-authenticate." },
        { status: 401 }
      );
    }

    // Service role client for writes
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get team
    const { data: team, error: teamError } = await serviceSupabase
      .from("teams")
      .select("id, github_org_login, created_by")
      .eq("github_org_login", slug)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is admin of this team OR the team creator
    const isCreator = team.created_by === authUser.id;

    const { data: membership } = await serviceSupabase
      .from("team_memberships")
      .select("role")
      .eq("team_id", team.id)
      .eq("user_id", authUser.id)
      .single();

    const isAdmin = membership?.role === "admin";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Only team admins or the team creator can refresh team data" },
        { status: 403 }
      );
    }

    // Fetch current org members from GitHub using user's token
    // If user is org admin, this returns ALL members (including private memberships)
    const members = await fetchAllOrgMembersWithUserToken(accessToken, team.github_org_login);

    // Get all vibetracking users (for case-insensitive matching)
    const { data: allUsers } = await serviceSupabase
      .from("users")
      .select("id, username");

    // Build case-insensitive username map
    const memberUsernamesLower = members.map((m) => m.login.toLowerCase());
    const usernameToUserId = new Map<string, string>();
    for (const user of allUsers || []) {
      if (
        user.username &&
        memberUsernamesLower.includes(user.username.toLowerCase())
      ) {
        usernameToUserId.set(user.username.toLowerCase(), user.id);
      }
    }

    // Get existing memberships
    const { data: existingMemberships } = await serviceSupabase
      .from("team_memberships")
      .select("id, github_username")
      .eq("team_id", team.id);

    const existingUsernames = new Set(
      (existingMemberships || []).map((m) => m.github_username.toLowerCase())
    );

    // Update existing memberships with user_id (case-insensitive match)
    for (const existing of existingMemberships || []) {
      const userId = usernameToUserId.get(existing.github_username.toLowerCase());
      if (userId) {
        await serviceSupabase
          .from("team_memberships")
          .update({ user_id: userId })
          .eq("id", existing.id);
      }
    }

    // Add new members that weren't in the team
    const newMemberships = members
      .filter((m) => !existingUsernames.has(m.login.toLowerCase()))
      .map((member) => ({
        team_id: team.id,
        github_username: member.login,
        user_id: usernameToUserId.get(member.login.toLowerCase()) || null,
        role: "member" as const,
      }));

    if (newMemberships.length > 0) {
      await serviceSupabase.from("team_memberships").insert(newMemberships);
    }

    // Recompute team stats
    const { data: allMemberships } = await serviceSupabase
      .from("team_memberships")
      .select("user_id")
      .eq("team_id", team.id);

    const activeMemberIds = (allMemberships || [])
      .filter((m) => m.user_id !== null)
      .map((m) => m.user_id as string);

    let totalTokens = 0;
    let totalCost = 0;
    let totalSessions = 0;
    let favoriteModel: string | null = null;
    let favoriteTool: string | null = null;

    if (activeMemberIds.length > 0) {
      const { data: memberStats } = await serviceSupabase
        .from("user_stats")
        .select("total_tokens, total_cost, total_sessions, favorite_model, favorite_tool")
        .in("user_id", activeMemberIds);

      if (memberStats) {
        const modelCounts = new Map<string, number>();
        const toolCounts = new Map<string, number>();

        for (const stat of memberStats) {
          totalTokens += Number(stat.total_tokens) || 0;
          totalCost += Number(stat.total_cost) || 0;
          totalSessions += stat.total_sessions || 0;

          if (stat.favorite_model) {
            modelCounts.set(
              stat.favorite_model,
              (modelCounts.get(stat.favorite_model) || 0) + 1
            );
          }
          if (stat.favorite_tool) {
            toolCounts.set(
              stat.favorite_tool,
              (toolCounts.get(stat.favorite_tool) || 0) + 1
            );
          }
        }

        // Find most common model and tool
        let maxModelCount = 0;
        for (const [model, count] of modelCounts) {
          if (count > maxModelCount) {
            maxModelCount = count;
            favoriteModel = model;
          }
        }

        let maxToolCount = 0;
        for (const [tool, count] of toolCounts) {
          if (count > maxToolCount) {
            maxToolCount = count;
            favoriteTool = tool;
          }
        }
      }
    }

    // Update team stats
    await serviceSupabase
      .from("team_stats")
      .update({
        member_count: (allMemberships || []).length,
        active_member_count: activeMemberIds.length,
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_sessions: totalSessions,
        favorite_model: favoriteModel,
        favorite_tool: favoriteTool,
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", team.id);

    return NextResponse.json({
      success: true,
      memberCount: (allMemberships || []).length,
      activeMemberCount: activeMemberIds.length,
      newMembersAdded: newMemberships.length,
      totalTokens,
      totalCost,
    });
  } catch (error) {
    console.error("Error refreshing team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
