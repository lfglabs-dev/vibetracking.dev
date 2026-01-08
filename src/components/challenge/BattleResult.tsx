"use client";

import { useState, useCallback } from "react";
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

  const winnerName = winner === "challenger" ? challengerName : challengedName;
  const loserName = winner === "challenger" ? challengedName : challengerName;

  // Human-like casual message for sharing
  const shareText =
    winner === "tie"
      ? `lmao we tied ${challengerName} vs ${challengedName} in a vibe coding battle\n\nboth elite coders apparently`
      : `just destroyed ${loserName} in a vibe coding battle lmao\n\n${challengerScore}-${challengedScore} get rekt`;

  // X-optimized text
  const xShareText =
    winner === "tie"
      ? `lmao we tied in a vibe coding battle 🤝\n\nboth elite coders apparently`
      : `just destroyed ${loserName} in a vibe coding battle lmao 🏆\n\n${challengerScore}-${challengedScore} get rekt`;

  const handleCopy = useCallback(async () => {
    const fullText = `${shareText}\n\ncheck it out: ${battleUrl}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = fullText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText, battleUrl]);

  const handleShareToX = useCallback(() => {
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(xShareText)}&url=${encodeURIComponent(battleUrl)}`;
    window.open(xUrl, "_blank", "noopener,noreferrer");
  }, [xShareText, battleUrl]);

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
          <h2 className="text-2xl sm:text-3xl font-black text-[#198754] break-words">{winnerName}</h2>
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

      {/* Share Options */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center w-full px-4 sm:px-0">
        <button
          onClick={handleShareToX}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-black text-white rounded-xl border-2 border-[#232323] hover:bg-[#232323] transition-colors font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Post to X
        </button>

        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl border-2 border-[#232323] transition-all font-medium ${
            copied ? "bg-[#198754] text-white" : "bg-[#EEF0F2] hover:bg-[#E0E2E4]"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
