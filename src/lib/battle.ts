import { createClient } from "@supabase/supabase-js";
import { type BattleStats, isValidTrashTalkId } from "@/lib/challenges";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Parse a battle slug like "@user1-vs-@user2" into usernames
 */
export function parseBattleSlug(
  slug: string
): { user1: string; user2: string } | null {
  // Decode URL-encoded characters (e.g., %40 -> @)
  const decodedSlug = decodeURIComponent(slug);
  // Expected format: @username1-vs-@username2
  const match = decodedSlug.match(/^@([a-zA-Z0-9_-]+)-vs-@([a-zA-Z0-9_-]+)$/);
  if (!match) {
    return null;
  }
  return { user1: match[1], user2: match[2] };
}

/**
 * Generate a battle URL from two usernames
 */
export function getBattleUrl(
  user1: string,
  user2: string,
  trashTalkId?: number
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.vibetracking.dev";
  const slug = `@${user1}-vs-@${user2}`;
  const url = `${baseUrl}/battle/${slug}`;
  if (trashTalkId !== undefined && isValidTrashTalkId(trashTalkId)) {
    return `${url}?trash=${trashTalkId}`;
  }
  return url;
}

/**
 * Get a user's battle stats by their user ID
 */
export async function getUserBattleStats(
  userId: string
): Promise<BattleStats | null> {
  // Get user profile
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return null;
  }

  // Get user stats (including total_cost for consistent spend display)
  const { data: stats, error: statsError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (statsError || !stats) {
    return null;
  }

  // Use total_cost directly from database for consistent spend across all pages
  const estimatedSpend = stats.total_cost || 0;

  // Calculate active days from daily_activity
  const { data: dailyActivity } = await supabase
    .from("daily_activity")
    .select("date")
    .eq("user_id", userId);

  const uniqueDates = new Set(dailyActivity?.map((d) => d.date) || []);
  const activeDays = uniqueDates.size;

  return {
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    totalTokens: stats.total_tokens || 0,
    totalSessions: stats.total_sessions || 0,
    currentStreak: stats.current_streak_days || 0,
    longestStreak: stats.longest_streak_days || 0,
    favoriteModel: stats.favorite_model,
    favoriteTool: stats.favorite_tool,
    estimatedSpend,
    activeDays,
  };
}

/**
 * Get a user's battle stats by their username
 */
export async function getUserBattleStatsByUsername(
  username: string
): Promise<BattleStats | null> {
  // First, find the user by username
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (userError || !user) {
    return null;
  }

  // Then get their full battle stats
  return getUserBattleStats(user.id);
}
