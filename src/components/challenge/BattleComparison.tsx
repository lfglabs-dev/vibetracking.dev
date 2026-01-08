"use client";

import { StatVersus } from "./StatVersus";
import { BattleResult } from "./BattleResult";
import { Logo } from "@/components/shared/Logo";
import type { BattleStats, BattleResult as BattleResultType } from "@/lib/challenges";

interface BattleComparisonProps {
  challenger: BattleStats;
  challenged: BattleStats;
  result: BattleResultType;
  battleSlug: string;
}

export function BattleComparison({
  challenger,
  challenged,
  result,
  battleSlug,
}: BattleComparisonProps) {
  const challengerName = challenger.displayName || challenger.username;
  const challengedName = challenged.displayName || challenged.username;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.vibetracking.dev";
  const battleUrl = `${baseUrl}/battle/${battleSlug}`;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-center mb-8">
          <Logo />
        </header>

        {/* VS Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#FEA6CC] px-4 py-2 rounded-full mb-4">
            <span className="text-lg">⚔️</span>
            <span className="font-bold text-[#232323]">BATTLE RESULTS</span>
            <span className="text-lg">⚔️</span>
          </div>
        </div>

        {/* Fighters */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            {/* Challenger */}
            <div className="flex-1 text-center">
              <div className="relative inline-block mb-3">
                {challenger.avatarUrl ? (
                  <img
                    src={challenger.avatarUrl}
                    alt={challengerName}
                    className={`w-20 h-20 rounded-full border-4 ${
                      result.winner === "challenger"
                        ? "border-[#198754] ring-4 ring-[#198754]/30"
                        : "border-[#232323]/20"
                    }`}
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-[#FEA6CC] border-4 ${
                      result.winner === "challenger"
                        ? "border-[#198754] ring-4 ring-[#198754]/30"
                        : "border-[#232323]/20"
                    }`}
                  >
                    {challengerName.charAt(0).toUpperCase()}
                  </div>
                )}
                {result.winner === "challenger" && (
                  <div className="absolute -top-2 -right-2 text-2xl">👑</div>
                )}
              </div>
              <h3 className="font-bold text-lg">{challengerName}</h3>
              <p className="text-sm text-[#232323]/60">@{challenger.username}</p>
              <div className="mt-2">
                <span
                  className={`text-2xl font-black ${
                    result.winner === "challenger"
                      ? "text-[#198754]"
                      : "text-[#232323]/60"
                  }`}
                >
                  {result.challengerScore}
                </span>
                <span className="text-sm text-[#232323]/40 ml-1">pts</span>
              </div>
            </div>

            {/* VS */}
            <div className="flex-shrink-0 mx-4">
              <div className="w-16 h-16 bg-[#232323] rounded-full flex items-center justify-center">
                <span className="text-white font-black text-lg">VS</span>
              </div>
            </div>

            {/* Challenged */}
            <div className="flex-1 text-center">
              <div className="relative inline-block mb-3">
                {challenged.avatarUrl ? (
                  <img
                    src={challenged.avatarUrl}
                    alt={challengedName}
                    className={`w-20 h-20 rounded-full border-4 ${
                      result.winner === "challenged"
                        ? "border-[#198754] ring-4 ring-[#198754]/30"
                        : "border-[#232323]/20"
                    }`}
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-[#B3D8F5] border-4 ${
                      result.winner === "challenged"
                        ? "border-[#198754] ring-4 ring-[#198754]/30"
                        : "border-[#232323]/20"
                    }`}
                  >
                    {challengedName.charAt(0).toUpperCase()}
                  </div>
                )}
                {result.winner === "challenged" && (
                  <div className="absolute -top-2 -right-2 text-2xl">👑</div>
                )}
              </div>
              <h3 className="font-bold text-lg">{challengedName}</h3>
              <p className="text-sm text-[#232323]/60">@{challenged.username}</p>
              <div className="mt-2">
                <span
                  className={`text-2xl font-black ${
                    result.winner === "challenged"
                      ? "text-[#198754]"
                      : "text-[#232323]/60"
                  }`}
                >
                  {result.challengedScore}
                </span>
                <span className="text-sm text-[#232323]/40 ml-1">pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="card mb-6">
          <h3 className="font-bold text-center mb-4 text-lg">
            Stats Breakdown
          </h3>
          <div className="divide-y divide-[#232323]/10">
            {result.statComparisons.map((stat, index) => (
              <StatVersus
                key={stat.label}
                label={stat.label}
                challengerValue={stat.challengerValue}
                challengedValue={stat.challengedValue}
                winner={stat.winner}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Result & Share */}
        <div className="card">
          <BattleResult
            winner={result.winner}
            challenger={challenger}
            challenged={challenged}
            challengerScore={result.challengerScore}
            challengedScore={result.challengedScore}
            battleUrl={battleUrl}
          />
        </div>

        {/* View Profiles */}
        <div className="mt-6 flex justify-center gap-4">
          <a
            href={`/@${challenger.username}`}
            className="text-sm text-[#232323]/60 hover:text-[#FEA6CC] transition-colors"
          >
            View {challengerName}&apos;s profile →
          </a>
          <span className="text-[#232323]/30">|</span>
          <a
            href={`/@${challenged.username}`}
            className="text-sm text-[#232323]/60 hover:text-[#FEA6CC] transition-colors"
          >
            View {challengedName}&apos;s profile →
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-[#232323]/50">
          <p>Track your AI coding vibes with Claude Code, Codex, and Cursor</p>
        </footer>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
