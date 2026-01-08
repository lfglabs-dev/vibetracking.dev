"use client";

import { useState } from "react";
import { ShareChallengeModal } from "./ShareChallengeModal";

interface ChallengeAFriendButtonProps {
  username: string;
  displayName?: string;
  estimatedSpend?: number;
}

export function ChallengeAFriendButton({
  username,
  displayName,
  estimatedSpend,
}: ChallengeAFriendButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary flex items-center gap-2 whitespace-nowrap"
        title="Challenge a friend"
      >
        {/* Share icon */}
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span className="hidden sm:inline">Challenge a friend</span>
        <span className="sm:hidden">Challenge</span>
      </button>

      <ShareChallengeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        username={username}
        displayName={displayName}
        estimatedSpend={estimatedSpend}
      />
    </>
  );
}
