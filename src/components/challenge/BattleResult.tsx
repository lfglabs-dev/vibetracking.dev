"use client";

import { useState } from "react";
import {
  getVictoryMessage,
  getTieMessage,
  type BattleStats,
} from "@/lib/challenges";

interface BattleResultProps {
  winner: "challenger" | "challenged" | "tie";
  challenger: BattleStats;
  challenged: BattleStats;
  challengerScore: number;
  challengedScore: number;
  battleUrl: string;
}

export function BattleResult({
  winner,
  challenger,
  challenged,
  challengerScore,
  challengedScore,
  battleUrl,
}: BattleResultProps) {
  const [copied, setCopied] = useState(false);

  const challengerName = challenger.displayName || challenger.username;
  const challengedName = challenged.displayName || challenged.username;

  const resultMessage =
    winner === "tie"
      ? getTieMessage()
      : getVictoryMessage(
          winner === "challenger" ? challengerName : challengedName,
          winner === "challenger" ? challengedName : challengerName
        );

  const winnerData = winner === "challenger" ? challenger : challenged;
  const winnerName = winner === "challenger" ? challengerName : challengedName;

  const handleCopy = async () => {
    const shareText =
      winner === "tie"
        ? `It's a draw! ${challengerName} vs ${challengedName} - both are elite vibe coders! 🤝\n\nSee the battle: ${battleUrl}`
        : `${winnerName} defeated their opponent in a vibe coding battle! 🏆\n\nScore: ${challengerScore} - ${challengedScore}\n\nSee the battle: ${battleUrl}`;

    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToX = () => {
    const tweetText =
      winner === "tie"
        ? `It's a draw! Both are elite vibe coders! 🤝`
        : `${winnerName} won the vibe coding battle! 🏆 Score: ${challengerScore}-${challengedScore}`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(battleUrl)}`;
    window.open(tweetUrl, "_blank");
  };

  return (
    <div className="text-center">
      {/* Trophy/Result Icon */}
      <div className="mb-4">
        {winner === "tie" ? (
          <div className="text-6xl">🤝</div>
        ) : (
          <div className="text-6xl animate-bounce">🏆</div>
        )}
      </div>

      {/* Winner Name */}
      {winner !== "tie" && (
        <div className="mb-2">
          <span className="text-sm text-[#232323]/60 uppercase tracking-wide">
            Winner
          </span>
          <h2 className="text-3xl font-black text-[#198754]">{winnerName}</h2>
        </div>
      )}

      {/* Score */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div
          className={`text-2xl font-bold ${
            winner === "challenger" ? "text-[#198754]" : "text-[#232323]/60"
          }`}
        >
          {challengerScore}
        </div>
        <div className="text-[#232323]/40">-</div>
        <div
          className={`text-2xl font-bold ${
            winner === "challenged" ? "text-[#198754]" : "text-[#232323]/60"
          }`}
        >
          {challengedScore}
        </div>
      </div>

      {/* Result Message */}
      <p className="text-lg text-[#232323]/80 mb-6 italic">{resultMessage}</p>

      {/* Share Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleShareToX}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share Result on X
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#232323] rounded-lg hover:bg-[#EEF0F2] transition-colors font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}
