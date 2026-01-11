"use client";

import type { BattleStats, BattleResult } from "@/lib/challenges";

interface SlideFinalProps {
  user: BattleStats;
  rival: BattleStats;
  result: BattleResult;
  animationKey: number;
}

export function SlideFinal({
  user,
  rival,
  result,
  animationKey,
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
        </div>
      </main>
    </div>
  );
}
