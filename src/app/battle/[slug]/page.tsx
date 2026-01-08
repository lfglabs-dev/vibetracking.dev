import { notFound } from "next/navigation";
import { BattleComparison } from "@/components/challenge/BattleComparison";
import { determineWinner, getTrashTalkMessage, isValidTrashTalkId } from "@/lib/challenges";
import { parseBattleSlug, getUserBattleStatsByUsername } from "@/lib/battle";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ trash?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { trash } = await searchParams;

  const parsed = parseBattleSlug(slug);
  if (!parsed) {
    return { title: "Battle Not Found | vibetracking" };
  }

  const [challengerStats, challengedStats] = await Promise.all([
    getUserBattleStatsByUsername(parsed.user1),
    getUserBattleStatsByUsername(parsed.user2),
  ]);

  if (!challengerStats || !challengedStats) {
    return { title: "Battle Not Found | vibetracking" };
  }

  const challengerName =
    challengerStats.displayName || challengerStats.username;
  const challengedName =
    challengedStats.displayName || challengedStats.username;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibetracking.dev";
  const ogUrl = trash
    ? `${baseUrl}/og/battle/${slug}?trash=${trash}`
    : `${baseUrl}/og/battle/${slug}`;

  const trashTalkId = trash ? parseInt(trash, 10) : undefined;
  const description =
    trashTalkId !== undefined && isValidTrashTalkId(trashTalkId)
      ? getTrashTalkMessage(trashTalkId).shareText
      : `Who's the better vibe coder? See the battle results!`;

  return {
    title: `${challengerName} vs ${challengedName} | vibetracking`,
    description,
    openGraph: {
      title: `${challengerName} vs ${challengedName} - Vibe Coding Battle`,
      description,
      images: [ogUrl],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${challengerName} vs ${challengedName} - Vibe Coding Battle`,
      description,
      images: [ogUrl],
    },
  };
}

export default async function BattlePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { trash } = await searchParams;

  // Parse the slug to get usernames
  const parsed = parseBattleSlug(slug);
  if (!parsed) {
    notFound();
  }

  // Fetch both users' battle stats
  const [challengerStats, challengedStats] = await Promise.all([
    getUserBattleStatsByUsername(parsed.user1),
    getUserBattleStatsByUsername(parsed.user2),
  ]);

  if (!challengerStats || !challengedStats) {
    notFound();
  }

  // Calculate the battle result
  const result = determineWinner(challengerStats, challengedStats);

  // Get trash talk message if provided
  const trashTalkId = trash ? parseInt(trash, 10) : undefined;
  const trashTalkMessage =
    trashTalkId !== undefined && isValidTrashTalkId(trashTalkId)
      ? getTrashTalkMessage(trashTalkId)
      : undefined;

  return (
    <>
      {trashTalkMessage && (
        <div className="bg-[#FEA6CC] text-[#232323] text-center py-3 px-4 font-medium">
          &quot;{trashTalkMessage.text}&quot;
        </div>
      )}
      <BattleComparison
        challenger={challengerStats}
        challenged={challengedStats}
        result={result}
        battleSlug={slug}
      />
    </>
  );
}
