"use client";

import { useState, useEffect, useCallback } from "react";

interface ShareChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  estimatedSpend?: number;
}

// Format spend in a human way: 4.2K, 847, etc.
function formatSpendHuman(spend: number): string {
  if (spend >= 1000) {
    return `${(spend / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return Math.round(spend).toString();
}

export function ShareChallengeModal({
  isOpen,
  onClose,
  username,
  estimatedSpend,
}: ShareChallengeModalProps) {
  const [copied, setCopied] = useState(false);

  const challengeUrl = `https://www.vibetracking.dev/invite/@${username}`;

  // Human-like casual message
  const spendText = estimatedSpend
    ? `I've burned ${formatSpendHuman(estimatedSpend)}$ on claude code and cursor lmao`
    : `I've been grinding on claude code and cursor lmao`;

  const fullShareMessage = `${spendText}\n\nI'm sure i'm beating you on this one but you can check here: ${challengeUrl}`;

  // X-optimized text (fits in tweet)
  const xShareText = `${spendText}\n\nI'm sure i'm beating you on this one but you can check here:`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullShareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = fullShareMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullShareMessage]);

  const handleShareToX = useCallback(() => {
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(xShareText)}&url=${encodeURIComponent(challengeUrl)}`;
    window.open(xUrl, "_blank", "noopener,noreferrer");
    onClose();
  }, [xShareText, challengeUrl, onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl border-2 border-[#232323] shadow-[4px_4px_0px_#232323] max-w-md w-full p-4 sm:p-6 mx-2 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-[#EEF0F2] rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-3xl sm:text-4xl mb-2">⚡</div>
          <h2 className="text-lg sm:text-xl font-bold">Challenge a Friend</h2>
          <p className="text-xs sm:text-sm text-[#232323]/60 mt-1">
            Share your challenge link
          </p>
        </div>

        {/* Share buttons */}
        <div className="space-y-3">
          {/* Post to X */}
          <button
            onClick={handleShareToX}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-xl border-2 border-[#232323] hover:bg-[#232323] transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Post to X</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-[#232323] transition-all font-medium ${
              copied
                ? "bg-[#198754] text-white"
                : "bg-[#EEF0F2] hover:bg-[#E0E2E4]"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
