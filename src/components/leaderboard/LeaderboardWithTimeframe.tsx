"use client";

import { useState, useEffect } from "react";
import { LeaderboardTable } from "./LeaderboardTable";

type LeaderboardPeriod = "7d" | "30d" | "all";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  teamSlug: string | null;
  teamName: string | null;
  teamIsPublic: boolean;
  totalTokens: number;
  totalSessions: number;
  currentStreak: number;
  favoriteModel: string | null;
  estimatedSpend: number;
  profileUrl: string;
}

interface LeaderboardWithTimeframeProps {
  initialEntries: LeaderboardEntry[];
  currentUserId?: string;
  currentUsername?: string;
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  "7d": "Week",
  "30d": "Month",
  all: "All Time",
};

export function LeaderboardWithTimeframe({
  initialEntries,
  currentUserId,
  currentUsername,
}: LeaderboardWithTimeframeProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Skip fetch for initial "all" period since we already have the data
    if (period === "all") {
      setEntries(initialEntries);
      return;
    }

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/leaderboard?period=${period}`);
        if (response.ok) {
          const data = await response.json();
          setEntries(data.leaderboard || []);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [period, initialEntries]);

  const periods: LeaderboardPeriod[] = ["7d", "30d", "all"];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Leaderboard</h2>
        <div className="flex items-center gap-0.5 bg-[#EEF0F2] rounded-full p-0.5 border border-[#232323]/10">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                period === p
                  ? "bg-white text-[#232323] shadow-sm"
                  : "text-[#232323]/60 hover:text-[#232323]"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#232323]" />
        </div>
      ) : (
        <LeaderboardTable
          entries={entries}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
        />
      )}
    </div>
  );
}
