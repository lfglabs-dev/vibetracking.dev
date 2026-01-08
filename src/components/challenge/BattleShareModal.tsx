"use client";

import { useState } from "react";
import { TRASH_TALK_MESSAGES } from "@/lib/challenges";
import { getBattleUrl } from "@/lib/battle";

interface BattleShareModalProps {
  myUsername: string;
  opponentUsername: string;
  opponentDisplayName?: string;
  onClose: () => void;
}

export function BattleShareModal({
  myUsername,
  opponentUsername,
  opponentDisplayName,
  onClose,
}: BattleShareModalProps) {
  const [selectedMessageId, setSelectedMessageId] = useState(0);
  const [copied, setCopied] = useState(false);

  const selectedMessage = TRASH_TALK_MESSAGES[selectedMessageId];
  const battleUrl = getBattleUrl(myUsername, opponentUsername, selectedMessageId);

  const handleCopy = async () => {
    const shareText = `${selectedMessage.shareText}\n\n${battleUrl}`;
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToX = () => {
    const tweetText = `${selectedMessage.shareText}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(battleUrl)}`;
    window.open(tweetUrl, "_blank");
  };

  const handleViewBattle = () => {
    window.location.href = battleUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl border-2 border-[#232323] shadow-[8px_8px_0px_0px_#232323] max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#232323]/10">
          <h2 className="text-xl font-bold">
            Challenge @{opponentUsername}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#EEF0F2] rounded-lg transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Message Selection */}
          <p className="text-sm text-[#232323]/70 mb-4">
            Pick your trash talk message:
          </p>

          <div className="space-y-2 mb-6">
            {TRASH_TALK_MESSAGES.map((message) => (
              <button
                key={message.id}
                onClick={() => setSelectedMessageId(message.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedMessageId === message.id
                    ? "border-[#FEA6CC] bg-[#FEA6CC]/10"
                    : "border-[#232323]/20 hover:border-[#232323]/40"
                }`}
              >
                <span className="text-sm">&quot;{message.text}&quot;</span>
              </button>
            ))}
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleViewBattle}
              className="btn-primary w-full flex items-center justify-center gap-2"
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
              <span>View Battle Results</span>
            </button>

            <button
              onClick={handleShareToX}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors font-medium"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </button>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#232323] rounded-lg hover:bg-[#EEF0F2] transition-colors font-medium"
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
              {copied ? "Copied!" : "Copy Message & Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
