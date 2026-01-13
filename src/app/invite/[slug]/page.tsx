import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { InvitePage } from "@/components/challenge/InvitePage";
import { getUserBattleStatsByUsername } from "@/lib/battle";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Parse invite slug like "@username" into username
 */
function parseInviteSlug(slug: string): string | null {
  // Decode URL-encoded characters (e.g., %40 -> @)
  const decodedSlug = decodeURIComponent(slug);
  // Expected format: @username
  const match = decodedSlug.match(/^@([a-zA-Z0-9_-]+)$/);
  if (!match) {
    return null;
  }
  return match[1];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const username = parseInviteSlug(slug);

  if (!username) {
    return { title: "Challenge Not Found | vibetracking" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: user } = await supabase
    .from("users")
    .select("display_name, username")
    .eq("username", username)
    .single();

  if (!user) {
    return { title: "Challenge Not Found | vibetracking" };
  }

  const displayName = user.display_name || username;
  const previewImage = "/previews/preview-invite.webp";

  return {
    title: `Challenge ${displayName} | vibetracking`,
    description: `${displayName} challenges you to a vibe coding battle! Think you can beat their AI coding stats?`,
    openGraph: {
      title: `${displayName} challenges you!`,
      description: `Think you can beat ${displayName}'s AI coding stats? Accept the challenge!`,
      images: [previewImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} challenges you!`,
      description: `Think you can beat ${displayName}'s AI coding stats? Accept the challenge!`,
      images: [previewImage],
    },
  };
}

export default async function InvitePageRoute({ params }: PageProps) {
  const { slug } = await params;
  const username = parseInviteSlug(slug);

  if (!username) {
    notFound();
  }

  // Fetch the challenger's stats
  const challengerStats = await getUserBattleStatsByUsername(username);

  if (!challengerStats) {
    notFound();
  }

  return <InvitePage challenger={challengerStats} />;
}
