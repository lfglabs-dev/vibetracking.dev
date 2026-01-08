"use client";

import { useRouter } from "next/navigation";

interface ChallengeUserButtonProps {
  myUsername: string;
  opponentUsername: string;
  opponentDisplayName?: string;
  variant?: "default" | "small" | "icon";
}

export function ChallengeUserButton({
  myUsername,
  opponentUsername,
  variant = "default",
}: ChallengeUserButtonProps) {
  const router = useRouter();

  const handleChallenge = () => {
    // Go directly to battle page without modal using Next.js router
    const battlePath = `/battle/@${myUsername}-vs-@${opponentUsername}`;
    router.push(battlePath);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleChallenge}
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
    );
  }

  if (variant === "small") {
    return (
      <button
        onClick={handleChallenge}
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
    );
  }

  return (
    <button
      onClick={handleChallenge}
      className="btn-primary flex items-center gap-2"
    >
      {/* Lightning icon for challenging a specific user */}
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
  );
}
