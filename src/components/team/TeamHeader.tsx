"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface TeamHeaderProps {
  team: {
    slug: string;
    name: string;
    avatarUrl: string | null;
    description: string | null;
    memberCount: number;
    activeMemberCount: number;
  };
  stats: {
    totalCost: number;
  };
}

export function TeamHeader({ team, stats }: TeamHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/team/${team.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card mb-6">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Team Avatar */}
        {team.avatarUrl ? (
          <img
            src={team.avatarUrl}
            alt={team.name}
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-[#AAE7C0] to-[#FEA6CC] flex items-center justify-center text-2xl sm:text-3xl font-black text-white flex-shrink-0">
            {team.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Team Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black">{team.name}</h1>
            <span className="tag tag-blue">Team</span>
          </div>
          <p className="text-[#232323]/60 text-sm mt-1">@{team.slug}</p>
          {team.description && (
            <p className="text-[#232323]/80 mt-2 text-sm hidden sm:block">{team.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 sm:mt-3 text-sm">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="font-bold">{team.activeMemberCount}</span>
              <span className="text-[#232323]/60">
                / {team.memberCount} active
              </span>
            </div>
            <div className="text-[#232323]/30 hidden sm:block">|</div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="font-bold text-[#238636]">
                {formatCurrency(stats.totalCost)}
              </span>
              <span className="text-[#232323]/60">spent</span>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="btn btn-secondary flex items-center gap-2 flex-shrink-0"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
