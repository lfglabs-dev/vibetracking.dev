"use client";

import { useState } from "react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { estimateApiSpendUsd } from "@/lib/pricing";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { FunComparison } from "@/components/dashboard/FunComparison";
import { UsageByToolChart } from "@/components/dashboard/UsageByToolChart";
import { UsageByModelChart } from "@/components/dashboard/UsageByModelChart";
import { UnitToggle, type DisplayUnit } from "@/components/dashboard/UnitToggle";
import { ShareButton } from "@/components/share/ShareButton";
import { Logo } from "@/components/shared/Logo";
import { AnimatedSticker } from "@/components/shared/AnimatedSticker";
import { formatModelName } from "@/lib/formatModelName";

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
    userPercentile: number;
  } | null;
  dailyActivity: {
    date: string;
    tool: string;
    messageCount: number;
    sessionCount: number;
    totalTokens: number;
  }[];
  tokenUsage: {
    date: string;
    tool: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
  }[];
  isOwnProfile: boolean;
}

export function ProfilePage({
  user,
  stats,
  dailyActivity,
  tokenUsage,
  isOwnProfile,
}: ProfilePageProps) {
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>("tokens");

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

  // Calculate estimated API spend for fun facts
  const estimatedApiSpend = stats
    ? estimateApiSpendUsd({
        model: stats.favoriteModel,
        totalTokens: stats.totalTokens,
      })
    : 0;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto relative">
        {/* Stickers */}
        <div
          className="pointer-events-none select-none absolute inset-0 z-0 overflow-visible"
          aria-hidden="true"
        >
          {/* Top section - near header */}
          <AnimatedSticker
            src="/stickers/vibe.webp"
            width={180}
            height={180}
            className="absolute top-[60px] -left-24 md:-left-44 lg:-left-52 w-32 md:w-44 rotate-[-12deg] hidden sm:block drop-shadow-lg"
            delay={100}
          />
          <AnimatedSticker
            src="/stickers/rainbow.webp"
            width={180}
            height={180}
            className="absolute top-[50px] -right-24 md:-right-44 lg:-right-52 w-32 md:w-44 rotate-[15deg] hidden sm:block drop-shadow-lg"
            delay={200}
          />
          {/* Profile section */}
          <AnimatedSticker
            src="/stickers/cloud.webp"
            width={120}
            height={120}
            className="absolute top-[220px] -left-20 md:-left-36 lg:-left-44 w-24 md:w-32 rotate-[8deg] hidden md:block drop-shadow-lg"
            delay={300}
          />
          <AnimatedSticker
            src="/stickers/banana.webp"
            width={140}
            height={140}
            className="absolute top-[240px] -right-24 md:-right-40 lg:-right-48 w-28 md:w-36 rotate-[-8deg] hidden md:block drop-shadow-lg"
            delay={400}
          />
          {/* Stats section */}
          <AnimatedSticker
            src="/stickers/cursor.webp"
            width={140}
            height={140}
            className="absolute top-[420px] -left-24 md:-left-40 lg:-left-48 w-28 md:w-36 rotate-[10deg] hidden md:block drop-shadow-lg"
            delay={500}
          />
          <AnimatedSticker
            src="/stickers/jensen.webp"
            width={150}
            height={150}
            className="absolute top-[450px] -right-24 md:-right-44 lg:-right-52 w-30 md:w-40 rotate-[-10deg] hidden md:block drop-shadow-lg"
            delay={600}
          />
          {/* Heatmap section */}
          <AnimatedSticker
            src="/stickers/cloud.webp"
            width={100}
            height={100}
            className="absolute top-[650px] -right-20 md:-right-32 lg:-right-40 w-20 md:w-28 rotate-[12deg] hidden lg:block drop-shadow-lg"
            delay={700}
          />
          <AnimatedSticker
            src="/stickers/no_em_dashes.webp"
            width={150}
            height={150}
            className="absolute top-[700px] -left-24 md:-left-40 lg:-left-48 w-30 md:w-40 rotate-[-6deg] hidden lg:block drop-shadow-lg"
            delay={800}
          />
          {/* Charts section */}
          <AnimatedSticker
            src="/stickers/elon.webp"
            width={140}
            height={140}
            className="absolute top-[900px] -right-24 md:-right-40 lg:-right-48 w-28 md:w-36 rotate-[8deg] hidden lg:block drop-shadow-lg"
            delay={900}
          />
          <AnimatedSticker
            src="/stickers/rainbow.webp"
            width={120}
            height={120}
            className="absolute top-[950px] -left-20 md:-left-36 lg:-left-44 w-24 md:w-32 rotate-[-10deg] hidden lg:block drop-shadow-lg"
            delay={1000}
          />
          {/* Fun comparison section */}
          <AnimatedSticker
            src="/stickers/marck.webp"
            width={140}
            height={140}
            className="absolute top-[1150px] -left-24 md:-left-40 lg:-left-48 w-28 md:w-36 rotate-[12deg] hidden lg:block drop-shadow-lg"
            delay={1100}
          />
          <AnimatedSticker
            src="/stickers/cloud.webp"
            width={100}
            height={100}
            className="absolute top-[1200px] -right-20 md:-right-32 lg:-right-40 w-20 md:w-28 rotate-[-8deg] hidden lg:block drop-shadow-lg"
            delay={1200}
          />
        </div>

        <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Logo />

          <div className="flex items-center gap-3">
            <UnitToggle value={displayUnit} onChange={setDisplayUnit} />
            <ShareButton
              url={typeof window !== "undefined" ? `${window.location.origin}${profileUrl}` : profileUrl}
              title={`${displayName}'s AI coding stats`}
              stats={stats ? { totalTokens: stats.totalTokens, totalSessions: stats.totalSessions } : undefined}
            />
          </div>
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
                <div className="text-3xl font-black text-[#D63384]">
                  {displayUnit === "usd"
                    ? formatCurrency(estimatedApiSpend)
                    : formatNumber(stats.totalTokens)}
                </div>
                <div className="text-sm text-[#232323]/60">
                  {displayUnit === "usd" ? "Est. API Spend" : "Total Tokens"}
                </div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-black text-[#0D6EFD]">
                  {formatNumber(stats.totalSessions)}
                </div>
                <div className="text-sm text-[#232323]/60">Sessions</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-black text-[#198754] text-base leading-tight">
                  {stats.favoriteModel ? formatModelName(stats.favoriteModel) : "N/A"}
                </div>
                <div className="text-sm text-[#232323]/60">Favorite Model</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-black text-[#CC9A06]">
                  {activeDays}
                </div>
                <div className="text-sm text-[#232323]/60">Active Days</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="card">
                <h3 className="font-bold mb-3">Highlights</h3>
                <ul className="space-y-2">
                  {stats.favoriteModel && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">Favorite Model</span>
                      <span className="tag tag-pink">{formatModelName(stats.favoriteModel)}</span>
                    </li>
                  )}
                  {stats.favoriteTool && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">Favorite Tool</span>
                      <span className="tag tag-blue">{stats.favoriteTool}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="card bg-gradient-to-br from-[#FEA6CC]/10 to-[#B3D8F5]/10">
                <h3 className="font-bold mb-2">Power User Ranking</h3>
                <div className="text-center py-2">
                  <div className="text-4xl font-black text-[#D63384] mb-1">
                    Top {stats.userPercentile}%
                  </div>
                  <p className="text-xs text-[#232323]/60">
                    by estimated API spend
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Heatmap */}
            {dailyActivity.length > 0 && (
              <div className="mb-8">
                <ActivityHeatmap dailyActivity={dailyActivity} />
              </div>
            )}

            {/* Usage Charts - Side by Side */}
            {(dailyActivity.length > 0 || tokenUsage.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {dailyActivity.length > 0 && (
                  <UsageByToolChart dailyActivity={dailyActivity} unit={displayUnit} />
                )}
                {tokenUsage.length > 0 && (
                  <UsageByModelChart tokenUsage={tokenUsage} unit={displayUnit} />
                )}
              </div>
            )}

            {/* Fun Comparison */}
            {stats.totalTokens > 10000 && (
              <div className="mb-8">
                <FunComparison
                  totalTokens={stats.totalTokens}
                  estimatedApiSpend={estimatedApiSpend}
                  activeDays={activeDays}
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
    </div>
  );
}
