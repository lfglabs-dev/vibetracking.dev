import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchOrgDetails,
  fetchAllOrgMembers,
  checkOrgMembership,
} from "@/lib/github-org";

export async function POST(request: Request) {
  try {
    const { orgLogin } = await request.json();

    if (!orgLogin) {
      return NextResponse.json(
        { error: "Organization login is required" },
        { status: 400 }
      );
    }

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

    // Verify user is a member of the organization
    const isMember = await checkOrgMembership(accessToken, orgLogin);
    if (!isMember) {
      return NextResponse.json(
        { error: "You must be a member of this organization" },
        { status: 403 }
      );
    }

    // Service role client for writes
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if team already exists
    const { data: existingTeam } = await serviceSupabase
      .from("teams")
      .select("id, github_org_login")
      .eq("github_org_login", orgLogin)
      .single();

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team for this organization already exists", teamSlug: existingTeam.github_org_login },
        { status: 409 }
      );
    }

    // Fetch organization details
    const orgDetails = await fetchOrgDetails(orgLogin);
    if (!orgDetails) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Fetch organization members
    const members = await fetchAllOrgMembers(orgLogin);

    // Create the team
    const { data: team, error: teamError } = await serviceSupabase
      .from("teams")
      .insert({
        github_org_id: String(orgDetails.id),
        github_org_login: orgDetails.login,
        name: orgDetails.name || orgDetails.login,
        avatar_url: orgDetails.avatar_url,
        description: orgDetails.description,
        created_by: authUser.id,
      })
      .select()
      .single();

    if (teamError) {
      console.error("Error creating team:", teamError);
      return NextResponse.json(
        { error: "Failed to create team" },
        { status: 500 }
      );
    }

    // Get vibetracking users by GitHub username (case-insensitive)
    // First get all users, then filter client-side for case-insensitive match
    const memberUsernamesLower = members.map((m) => m.login.toLowerCase());
    const { data: allUsers } = await serviceSupabase
      .from("users")
      .select("id, username");

    // Build case-insensitive map
    const usernameToUserId = new Map<string, string>();
    for (const user of allUsers || []) {
      if (user.username && memberUsernamesLower.includes(user.username.toLowerCase())) {
        usernameToUserId.set(user.username.toLowerCase(), user.id);
      }
    }

    // Create team memberships
    const memberships = members.map((member) => ({
      team_id: team.id,
      github_username: member.login,
      user_id: usernameToUserId.get(member.login.toLowerCase()) || null,
      role: member.login.toLowerCase() === authUser.user_metadata?.user_name?.toLowerCase()
        ? "admin"
        : "member",
    }));

    const { error: membershipError } = await serviceSupabase
      .from("team_memberships")
      .insert(memberships);

    if (membershipError) {
      console.error("Error creating memberships:", membershipError);
      // Don't fail - team is created, memberships can be fixed later
    }

    // Compute initial team stats
    const activeMembers = memberships.filter((m) => m.user_id !== null);
    const activeMemberIds = activeMembers
      .map((m) => m.user_id)
      .filter((id): id is string => id !== null);

    let totalTokens = 0;
    let totalCost = 0;
    let totalSessions = 0;

    if (activeMemberIds.length > 0) {
      const { data: memberStats } = await serviceSupabase
        .from("user_stats")
        .select("total_tokens, total_cost, total_sessions")
        .in("user_id", activeMemberIds);

      if (memberStats) {
        for (const stat of memberStats) {
          totalTokens += Number(stat.total_tokens) || 0;
          totalCost += Number(stat.total_cost) || 0;
          totalSessions += stat.total_sessions || 0;
        }
      }
    }

    // Insert team stats
    const { error: statsError } = await serviceSupabase
      .from("team_stats")
      .insert({
        team_id: team.id,
        member_count: members.length,
        active_member_count: activeMembers.length,
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_sessions: totalSessions,
      });

    if (statsError) {
      console.error("Error creating team stats:", statsError);
    }

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        slug: team.github_org_login,
        name: team.name,
        avatarUrl: team.avatar_url,
        memberCount: members.length,
        activeMemberCount: activeMembers.length,
      },
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
