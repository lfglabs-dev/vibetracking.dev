"use client";

import { useState } from "react";
import { BattleShareModal } from "./BattleShareModal";

interface ChallengeUserButtonProps {
  myUsername: string;
  opponentUsername: string;
  opponentDisplayName?: string;
  variant?: "default" | "small" | "icon";
}

export function ChallengeUserButton({
  myUsername,
  opponentUsername,
  opponentDisplayName,
  variant = "default",
}: ChallengeUserButtonProps) {
  const [showModal, setShowModal] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 hover:bg-[#FEA6CC]/20 rounded-lg transition-colors"
          title={`Challenge @${opponentUsername}`}
        >
          <svg
            className="w-4 h-4 text-[#232323]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </button>

        {showModal && (
          <BattleShareModal
            myUsername={myUsername}
            opponentUsername={opponentUsername}
            opponentDisplayName={opponentDisplayName}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  if (variant === "small") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm px-3 py-1.5 bg-[#FEA6CC] text-[#232323] rounded-lg hover:bg-[#FEA6CC]/80 transition-colors font-medium flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Battle
        </button>

        {showModal && (
          <BattleShareModal
            myUsername={myUsername}
            opponentUsername={opponentUsername}
            opponentDisplayName={opponentDisplayName}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span>Challenge @{opponentUsername}</span>
      </button>

      {showModal && (
        <BattleShareModal
          myUsername={myUsername}
          opponentUsername={opponentUsername}
          opponentDisplayName={opponentDisplayName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
