import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Use service role client for user creation
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Check if user profile exists, create if not
      const { data: existingUser } = await serviceSupabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingUser) {
        // Create user profile from GitHub data
        const githubId = data.user.user_metadata?.provider_id;
        const username = data.user.user_metadata?.user_name || data.user.user_metadata?.preferred_username;
        const displayName = data.user.user_metadata?.full_name || data.user.user_metadata?.name;
        const avatarUrl = data.user.user_metadata?.avatar_url;

        await serviceSupabase.from("users").insert({
          id: data.user.id,
          github_id: githubId,
          username: username || `user_${data.user.id.slice(0, 8)}`,
          display_name: displayName,
          avatar_url: avatarUrl,
          is_anonymous: false,
        });
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth error - redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
