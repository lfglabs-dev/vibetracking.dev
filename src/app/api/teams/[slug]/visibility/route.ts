import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { isPublic } = await request.json();

    if (typeof isPublic !== "boolean") {
      return NextResponse.json(
        { error: "isPublic must be a boolean" },
        { status: 400 }
      );
    }

    // Get current user
    const authSupabase = await createServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role for data operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, created_by")
      .eq("github_org_login", slug)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is team creator or admin
    let hasPermission = team.created_by === user.id;

    if (!hasPermission) {
      // Check if user is an admin member
      const { data: membership } = await supabase
        .from("team_memberships")
        .select("role")
        .eq("team_id", team.id)
        .eq("user_id", user.id)
        .single();

      if (membership?.role === "admin") {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only team admins can change visibility" },
        { status: 403 }
      );
    }

    // Update team visibility
    const { error: updateError } = await supabase
      .from("teams")
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq("id", team.id);

    if (updateError) {
      console.error("Error updating team visibility:", updateError);
      return NextResponse.json(
        { error: "Failed to update team visibility" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, isPublic });
  } catch (error) {
    console.error("Error in team visibility API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
