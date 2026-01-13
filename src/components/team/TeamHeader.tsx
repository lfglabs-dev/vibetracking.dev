"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface TeamHeaderProps {
  team: {
    slug: string;
    name: string;
    avatarUrl: string | null;
    description: string | null;
    memberCount: number;
    activeMemberCount: number;
    isPublic: boolean;
  };
  stats: {
    totalCost: number;
  };
  isAdmin: boolean;
}

export function TeamHeader({ team, stats, isAdmin }: TeamHeaderProps) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(team.isPublic);
  const [isToggling, setIsToggling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleToggleVisibility = async () => {
    if (isToggling) return;
    setIsToggling(true);

    try {
      const response = await fetch(`/api/teams/${team.slug}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (response.ok) {
        setIsPublic(!isPublic);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const response = await fetch(`/api/teams/${team.slug}/refresh`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        setRefreshError(data.error || "Failed to refresh team data");
      }
    } catch (error) {
      console.error("Failed to refresh team:", error);
      setRefreshError("Failed to refresh team data");
    } finally {
      setIsRefreshing(false);
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
          <h1 className="text-xl sm:text-2xl font-black">{team.name}</h1>
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

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Refresh Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-[#232323]/10 text-[#232323]/70 hover:bg-[#232323]/20 ${
                isRefreshing ? "opacity-50 !cursor-not-allowed" : ""
              }`}
              title="Sync members from GitHub"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Sync"}</span>
            </button>
          )}

          {/* Visibility Toggle (Admin only) */}
          {isAdmin && (
            <button
              onClick={handleToggleVisibility}
              disabled={isToggling}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isPublic
                  ? "bg-[#AAE7C0]/20 text-[#238636] hover:bg-[#AAE7C0]/30"
                  : "bg-[#232323]/10 text-[#232323]/60 hover:bg-[#232323]/20"
              } ${isToggling ? "opacity-50 !cursor-not-allowed" : ""}`}
              title={isPublic ? "Team is public" : "Team is private"}
            >
              {isPublic ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              <span className="hidden sm:inline">{isPublic ? "Public" : "Private"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Refresh Error Message */}
      {refreshError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {refreshError}
        </div>
      )}
    </div>
  );
}
