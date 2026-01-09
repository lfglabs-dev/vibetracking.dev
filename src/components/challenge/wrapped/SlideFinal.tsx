"use client";

import type { BattleStats, BattleResult } from "@/lib/challenges";

interface SlideFinalProps {
  user: BattleStats;
  rival: BattleStats;
  result: BattleResult;
  animationKey: number;
  battleUrl: string;
}

export function SlideFinal({
  user,
  rival,
  result,
  animationKey,
  battleUrl,
}: SlideFinalProps) {
  const userName = user.displayName || user.username;
  const rivalName = rival.displayName || rival.username;

  const winnerName =
    result.winner === "challenger"
      ? userName
      : result.winner === "challenged"
        ? rivalName
        : null;

  const winnerAvatar =
    result.winner === "challenger"
      ? user.avatarUrl
      : result.winner === "challenged"
        ? rival.avatarUrl
        : null;

  const isTie = result.winner === "tie";

  // Calculate rounds won (for display)
  const userRoundsWon = result.statComparisons.filter(
    (s) => s.winner === "challenger"
  ).length;
  const rivalRoundsWon = result.statComparisons.filter(
    (s) => s.winner === "challenged"
  ).length;

  const handleShare = () => {
    const text = isTie
      ? `It's a tie! ${userName} and ${rivalName} are equally matched in the vibe coding battle! 🎮`
      : `${winnerName} won the vibe coding battle ${result.challengerScore}-${result.challengedScore}! 🏆`;

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(battleUrl)}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(battleUrl);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      key={animationKey}
      className="battle-slide card relative animate-slide-fade-in"
    >
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-4">
        <div className="space-y-4">
          {/* Winner Announcement - No title, just avatar and name */}
          <div className="text-center">
            {isTie ? (
              <div className="animate-scale-pop">
                <div className="text-6xl mb-3">🤝</div>
                <h2 className="text-3xl font-black text-[#232323]">
                  It&apos;s a Tie!
                </h2>
              </div>
            ) : (
              <div className="animate-scale-pop">
                {/* Crown */}
                <div
                  className="text-5xl mb-1 animate-initial animate-crown-bounce"
                  style={{ animationDelay: "200ms" }}
                >
                  👑
                </div>

                {/* Winner Avatar */}
                <div className="relative inline-block mb-3">
                  {winnerAvatar ? (
                    <img
                      src={winnerAvatar}
                      alt={winnerName || "Winner"}
                      className="w-20 h-20 rounded-full border-3 border-[#198754] ring-3 ring-[#198754]/30"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#AAE7C0] border-3 border-[#198754] flex items-center justify-center text-2xl font-bold">
                      {winnerName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="text-3xl font-black text-[#198754]">
                  {winnerName} Wins!
                </h2>
              </div>
            )}
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-center gap-6">
            {/* User Score */}
            <div
              className={`text-center p-4 rounded-xl border-2 min-w-[120px] ${
                result.winner === "challenger"
                  ? "border-[#198754] bg-[#198754]/10"
                  : "border-[#232323]/10 bg-[#FEA6CC]/10"
              }`}
            >
              <p className="text-xs text-[#232323]/60 mb-1">{userName}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className={`text-4xl font-black ${
                    result.winner === "challenger"
                      ? "text-[#198754]"
                      : "text-[#232323]"
                  }`}
                >
                  {result.challengerScore}
                </span>
                <span className="text-sm text-[#232323]/40">pts</span>
              </div>
              <p className="text-xs text-[#232323]/50">
                {userRoundsWon} rounds won
              </p>
            </div>

            {/* VS */}
            <div className="text-xl font-black text-[#232323]/30">-</div>

            {/* Rival Score */}
            <div
              className={`text-center p-4 rounded-xl border-2 min-w-[120px] ${
                result.winner === "challenged"
                  ? "border-[#198754] bg-[#198754]/10"
                  : "border-[#232323]/10 bg-[#B3D8F5]/10"
              }`}
            >
              <p className="text-xs text-[#232323]/60 mb-1">{rivalName}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className={`text-4xl font-black ${
                    result.winner === "challenged"
                      ? "text-[#198754]"
                      : "text-[#232323]"
                  }`}
                >
                  {result.challengedScore}
                </span>
                <span className="text-sm text-[#232323]/40">pts</span>
              </div>
              <p className="text-xs text-[#232323]/50">
                {rivalRoundsWon} rounds won
              </p>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#232323] text-white rounded-lg font-medium hover:bg-[#232323]/80 transition-colors text-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#232323] rounded-lg font-medium hover:bg-[#EEF0F2] transition-colors shadow-[0px_2px_0px_0px_#232323] hover:shadow-[0px_1px_0px_0px_#232323] hover:translate-y-0.5 text-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Link
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
