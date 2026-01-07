import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { estimateApiSpendUsd } from "@/lib/pricing";
import type { Metadata } from "next";

interface PageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: user } = await supabase
    .from("users")
    .select("display_name, anonymous_id")
    .eq("anonymous_id", id)
    .single();

  if (!user) {
    return {
      title: "User Not Found | vibetracking",
    };
  }

  const displayName = user.display_name || `Anonymous #${id.slice(0, 8)}`;

  return {
    title: `${displayName} | vibetracking`,
    description: `Check out ${displayName}'s AI coding stats on vibetracking`,
    openGraph: {
      title: `${displayName} | vibetracking`,
      description: `Check out ${displayName}'s AI coding stats on vibetracking`,
      images: [`/og/u/${id}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} | vibetracking`,
      description: `Check out ${displayName}'s AI coding stats on vibetracking`,
      images: [`/og/u/${id}`],
    },
  };
}

export default async function AnonymousProfilePage({ params }: PageParams) {
  const { id } = await params;

  const authSupabase = await createServerClient();
  const {
    data: { user: authUser },
  } = await authSupabase.auth.getUser();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get user profile by anonymous_id
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("anonymous_id", id)
    .single();

  if (error || !user) {
    notFound();
  }

  // Get user stats
  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get daily activity for heatmap
  const { data: dailyActivity } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(365);

  // Get token usage for model breakdown chart
  const { data: tokenUsage } = await supabase
    .from("token_usage")
    .select("date, tool, model, input_tokens, output_tokens")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  // Calculate user percentile based on estimated spend
  // "Top X%" means you're in the top X% of users by API spend
  // E.g., "Top 5%" means you're better than 95% of users
  let userPercentile = 50; // Default
  if (stats) {
    const { data: allUserStats } = await supabase
      .from("user_stats")
      .select("user_id, total_tokens, favorite_model");

    if (allUserStats && allUserStats.length > 1) {
      const userSpend = estimateApiSpendUsd({
        model: stats.favorite_model,
        totalTokens: stats.total_tokens,
      });
      const allSpends = allUserStats.map((u) =>
        estimateApiSpendUsd({
          model: u.favorite_model,
          totalTokens: u.total_tokens,
        })
      );
      // Count users with higher spend (higher rank)
      const usersAbove = allSpends.filter((spend) => spend > userSpend).length;
      // Your rank = usersAbove + 1 (1-indexed)
      // Percentile = (rank / total) * 100
      // If 0 users above, you're rank 1 = top (1/N * 100)%
      userPercentile = Math.max(1, Math.ceil(((usersAbove + 1) / allUserStats.length) * 100));
    } else {
      // Only 1 user in the system = you're #1
      userPercentile = 1;
    }
  }

  const isOwnProfile = authUser?.id === user.id;

  return (
    <ProfilePage
      user={{
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        company: user.company,
        isAnonymous: user.is_anonymous,
        anonymousId: user.anonymous_id,
      }}
      stats={
        stats
          ? {
              totalTokens: stats.total_tokens,
              totalSessions: stats.total_sessions,
              favoriteModel: stats.favorite_model,
              favoriteTool: stats.favorite_tool,
              longestSessionMs: stats.longest_session_ms,
              longestStreakDays: stats.longest_streak_days,
              currentStreakDays: stats.current_streak_days,
              firstActivityDate: stats.first_activity_date,
              lastActivityDate: stats.last_activity_date,
              userPercentile,
            }
          : null
      }
      dailyActivity={
        dailyActivity?.map((a) => ({
          date: a.date,
          tool: a.tool,
          messageCount: a.message_count,
          sessionCount: a.session_count,
          totalTokens: a.total_tokens,
        })) || []
      }
      tokenUsage={
        tokenUsage?.map((t) => ({
          date: t.date,
          tool: t.tool,
          model: t.model,
          inputTokens: t.input_tokens,
          outputTokens: t.output_tokens,
        })) || []
      }
      isOwnProfile={isOwnProfile}
    />
  );
}
