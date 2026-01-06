"use client";

import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { FunComparison } from "@/components/dashboard/FunComparison";
import { ShareButton } from "@/components/share/ShareButton";

interface ProfilePageProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    company: string | null;
    isAnonymous: boolean;
    anonymousId: string | null;
  };
  stats: {
    totalTokens: number;
    totalSessions: number;
    favoriteModel: string | null;
    favoriteTool: string | null;
    longestSessionMs: number;
    longestStreakDays: number;
    currentStreakDays: number;
    firstActivityDate: string | null;
    lastActivityDate: string | null;
  } | null;
  dailyActivity: {
    date: string;
    tool: string;
    messageCount: number;
    sessionCount: number;
    totalTokens: number;
  }[];
  isOwnProfile: boolean;
}

export function ProfilePage({
  user,
  stats,
  dailyActivity,
  isOwnProfile,
}: ProfilePageProps) {
  // Profile URL - clean /username format for authenticated users
  const profileUrl = user.isAnonymous
    ? `/u/${user.anonymousId}`
    : `/${user.username}`;

  const displayName = user.displayName || user.username;

  // Format longest session
  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate active days from daily activity
  const activeDays = new Set(dailyActivity.map((a) => a.date)).size;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/">
            <h1 className="text-3xl font-black">
              <span className="text-[#FEA6CC]">vibe</span>
              <span className="text-[#AAE7C0]">tracking</span>
            </h1>
          </Link>

          <ShareButton
            url={typeof window !== "undefined" ? `${window.location.origin}${profileUrl}` : profileUrl}
            title={`${displayName}'s AI coding stats`}
            stats={stats ? { totalTokens: stats.totalTokens, totalSessions: stats.totalSessions } : undefined}
          />
        </header>

        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex items-center gap-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full border-2 border-[#232323]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#FEA6CC] border-2 border-[#232323] flex items-center justify-center text-2xl font-bold text-[#232323]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{displayName}</h2>
              {user.company && (
                <p className="text-[#232323]/60">{user.company}</p>
              )}
              <p className="text-sm text-[#232323]/40">
                {user.isAnonymous ? `Anonymous #${user.anonymousId?.slice(0, 8)}` : `@${user.username}`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card text-center">
                <div className="text-3xl font-black text-[#FEA6CC]">
                  {formatNumber(stats.totalTokens)}
                </div>
                <div className="text-sm text-[#232323]/60">Total Tokens</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-black text-[#B3D8F5]">
                  {formatNumber(stats.totalSessions)}
                </div>
                <div className="text-sm text-[#232323]/60">Sessions</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-black text-[#AAE7C0]">
                  {stats.currentStreakDays}
                </div>
                <div className="text-sm text-[#232323]/60">Current Streak</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-black text-[#F0F69B]">
                  {activeDays}
                </div>
                <div className="text-sm text-[#232323]/60">Active Days</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="card">
                <h3 className="font-bold mb-4">Highlights</h3>
                <ul className="space-y-3">
                  {stats.favoriteModel && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">Favorite Model</span>
                      <span className="tag tag-pink">{stats.favoriteModel}</span>
                    </li>
                  )}
                  {stats.favoriteTool && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">Favorite Tool</span>
                      <span className="tag tag-blue">{stats.favoriteTool}</span>
                    </li>
                  )}
                  {stats.longestSessionMs > 0 && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">Longest Session</span>
                      <span className="tag tag-green">
                        {formatDuration(stats.longestSessionMs)}
                      </span>
                    </li>
                  )}
                  <li className="flex items-center justify-between">
                    <span className="text-[#232323]/60">Best Streak</span>
                    <span className="tag tag-yellow">
                      {stats.longestStreakDays} days
                    </span>
                  </li>
                </ul>
              </div>

              <div className="card">
                <h3 className="font-bold mb-4">Timeline</h3>
                <ul className="space-y-3">
                  {stats.firstActivityDate && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">First Activity</span>
                      <span className="font-medium">
                        {new Date(stats.firstActivityDate).toLocaleDateString()}
                      </span>
                    </li>
                  )}
                  {stats.lastActivityDate && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">Last Activity</span>
                      <span className="font-medium">
                        {new Date(stats.lastActivityDate).toLocaleDateString()}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Activity Heatmap */}
            {dailyActivity.length > 0 && (
              <div className="mb-8">
                <ActivityHeatmap dailyActivity={dailyActivity} />
              </div>
            )}

            {/* Fun Comparison */}
            {stats.totalTokens > 10000 && (
              <div className="mb-8">
                <FunComparison
                  totalTokens={stats.totalTokens}
                  totalSessions={stats.totalSessions}
                  longestSessionMs={stats.longestSessionMs}
                />
              </div>
            )}
          </>
        ) : (
          <div className="card text-center py-12">
            <p className="text-[#232323]/60">No activity data yet</p>
            <p className="text-sm text-[#232323]/40 mt-2">
              Run <code className="bg-[#F0F69B]/50 px-2 py-1 rounded">bunx vibetracking</code> to import your stats
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-[#232323]/50">
          <p>Track your AI coding vibes with Claude Code, Codex, and Cursor</p>
        </footer>
      </div>
    </div>
  );
}
