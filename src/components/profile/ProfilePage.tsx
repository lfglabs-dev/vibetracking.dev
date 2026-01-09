"use client";

import { useState } from "react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { FunComparison } from "@/components/dashboard/FunComparison";
import { UsageByToolChart } from "@/components/dashboard/UsageByToolChart";
import { UsageByModelChart } from "@/components/dashboard/UsageByModelChart";
import { TokenBreakdownChart } from "@/components/dashboard/TokenBreakdownChart";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { TimeOfDayHeatmap } from "@/components/dashboard/TimeOfDayHeatmap";
import { ModelMigrationTimeline } from "@/components/dashboard/ModelMigrationTimeline";
import { UnitToggle, type DisplayUnit } from "@/components/dashboard/UnitToggle";
import { ChallengeUserButton } from "@/components/challenge/ChallengeUserButton";
import { ChallengeAFriendButton } from "@/components/challenge/ChallengeAFriendButton";
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
  };
  stats: {
    totalTokens: number;
    totalSessions: number;
    totalCost: number;
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
    cost: number;
  }[];
  tokenUsage: {
    date: string;
    tool: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
    reasoningTokens: number;
    cost: number;
  }[];
  isOwnProfile: boolean;
  currentUsername?: string;
}

export function ProfilePage({
  user,
  stats,
  dailyActivity,
  tokenUsage,
  isOwnProfile,
  currentUsername,
}: ProfilePageProps) {
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>("tokens");

  // Profile URL - clean /username format
  const profileUrl = `/@${user.username}`;

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

  // Use actual cost from database for fun facts (more accurate than estimation)
  const estimatedApiSpend = stats?.totalCost ?? 0;

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
          {/* Token Breakdown + Cost Trend section */}
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
          {/* Time of Day Heatmap section */}
          <AnimatedSticker
            src="/stickers/banana.webp"
            width={130}
            height={130}
            className="absolute top-[1400px] -left-24 md:-left-40 lg:-left-48 w-26 md:w-34 rotate-[-15deg] hidden lg:block drop-shadow-lg"
            delay={1300}
          />
          <AnimatedSticker
            src="/stickers/cursor.webp"
            width={120}
            height={120}
            className="absolute top-[1450px] -right-24 md:-right-40 lg:-right-48 w-24 md:w-32 rotate-[10deg] hidden lg:block drop-shadow-lg"
            delay={1400}
          />
          {/* Model Migration Timeline section */}
          <AnimatedSticker
            src="/stickers/jensen.webp"
            width={140}
            height={140}
            className="absolute top-[1650px] -right-24 md:-right-44 lg:-right-52 w-28 md:w-36 rotate-[-12deg] hidden lg:block drop-shadow-lg"
            delay={1500}
          />
          <AnimatedSticker
            src="/stickers/vibe.webp"
            width={130}
            height={130}
            className="absolute top-[1700px] -left-24 md:-left-40 lg:-left-48 w-26 md:w-34 rotate-[8deg] hidden lg:block drop-shadow-lg"
            delay={1600}
          />
          {/* Fun comparison section */}
          <AnimatedSticker
            src="/stickers/rainbow.webp"
            width={140}
            height={140}
            className="absolute top-[1900px] -left-24 md:-left-40 lg:-left-48 w-28 md:w-36 rotate-[-10deg] hidden lg:block drop-shadow-lg"
            delay={1700}
          />
          <AnimatedSticker
            src="/stickers/elon.webp"
            width={130}
            height={130}
            className="absolute top-[1950px] -right-24 md:-right-40 lg:-right-48 w-26 md:w-34 rotate-[15deg] hidden lg:block drop-shadow-lg"
            delay={1800}
          />
          {/* Footer section */}
          <AnimatedSticker
            src="/stickers/no_em_dashes.webp"
            width={120}
            height={120}
            className="absolute top-[2150px] -right-20 md:-right-36 lg:-right-44 w-24 md:w-32 rotate-[-6deg] hidden lg:block drop-shadow-lg"
            delay={1900}
          />
          <AnimatedSticker
            src="/stickers/cloud.webp"
            width={110}
            height={110}
            className="absolute top-[2200px] -left-20 md:-left-36 lg:-left-44 w-22 md:w-28 rotate-[12deg] hidden lg:block drop-shadow-lg"
            delay={2000}
          />
        </div>

        <div className="relative z-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Logo />

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <UnitToggle value={displayUnit} onChange={setDisplayUnit} />
            {isOwnProfile ? (
              // Own profile: show "Challenge a friend" button (with share icon)
              <ChallengeAFriendButton
                username={user.username}
                displayName={user.displayName || undefined}
                estimatedSpend={estimatedApiSpend}
              />
            ) : (
              // Other's profile: show Challenge button only (with lightning icon)
              currentUsername && stats && (
                <ChallengeUserButton
                  myUsername={currentUsername}
                  opponentUsername={user.username}
                  opponentDisplayName={user.displayName || undefined}
                />
              )
            )}
          </div>
        </header>

        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#232323] flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FEA6CC] border-2 border-[#232323] flex items-center justify-center text-xl sm:text-2xl font-bold text-[#232323] flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h2>
              {user.company && (
                <p className="text-[#232323]/60 text-sm sm:text-base truncate">{user.company}</p>
              )}
              <p className="text-sm text-[#232323]/40">@{user.username}</p>
            </div>
            <a
              href={`https://github.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 hover:opacity-80 transition-opacity hidden sm:block"
            >
              <svg className="w-8 h-8 text-[#232323]" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        {stats ? (
          <>
            {/* Row 1: 4 KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

            {/* Row 2: Highlights + Insights (2 cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  {stats.currentStreakDays > 0 && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">Current Streak</span>
                      <span className="tag tag-green">{stats.currentStreakDays} days</span>
                    </li>
                  )}
                  {stats.longestStreakDays > 0 && (
                    <li className="flex items-center justify-between">
                      <span className="text-[#232323]/60">Best Streak</span>
                      <span className="tag tag-yellow">{stats.longestStreakDays} days</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="card bg-gradient-to-br from-[#FEA6CC]/10 to-[#B3D8F5]/10 flex flex-col">
                <h3 className="font-bold mb-4">Insights</h3>
                {(() => {
                  const totals = tokenUsage.reduce(
                    (acc, t) => ({
                      output: acc.output + t.outputTokens,
                      reasoning: acc.reasoning + t.reasoningTokens,
                    }),
                    { output: 0, reasoning: 0 }
                  );
                  const totalGenerated = totals.output + totals.reasoning;
                  const reasoningPct = totalGenerated > 0 ? (totals.reasoning / totalGenerated) * 100 : 0;
                  const hasReasoning = totals.reasoning > 0;
                  const label = reasoningPct >= 50 ? "Heavy" : reasoningPct >= 25 ? "Deep" : "Light";

                  // When no reasoning data, show just ranking without progress bar
                  if (!hasReasoning) {
                    return (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-4xl font-black text-[#D63384]">Top {stats.userPercentile}%</span>
                          <p className="text-sm text-[#232323]/60 mt-2">Power User Ranking</p>
                        </div>
                      </div>
                    );
                  }

                  // When reasoning exists, show both metrics with progress bars
                  return (
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      {/* Power User Ranking */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#232323]/60">Power User Ranking</span>
                          <span className="text-lg font-black text-[#D63384]">Top {stats.userPercentile}%</span>
                        </div>
                        <div className="h-3 bg-[#232323]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D63384] rounded-full transition-all duration-500"
                            style={{ width: `${100 - stats.userPercentile}%` }}
                          />
                        </div>
                      </div>
                      {/* Reasoning Tokens */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#232323]/60">{label} Thinker</span>
                          <span className="text-lg font-black text-[#6F42C1]">{reasoningPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-[#232323]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#6F42C1] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(reasoningPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Row 3: Usage by Tool + Usage by Model (2 charts) */}
            {(dailyActivity.length > 0 || tokenUsage.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {dailyActivity.length > 0 && (
                  <UsageByToolChart dailyActivity={dailyActivity} unit={displayUnit} />
                )}
                {tokenUsage.length > 0 && (
                  <UsageByModelChart tokenUsage={tokenUsage} unit={displayUnit} />
                )}
              </div>
            )}

            {/* Row 4: Token Breakdown + Cost Trend (2 charts) */}
            {tokenUsage.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <TokenBreakdownChart tokenUsage={tokenUsage} />
                <CostTrendChart dailyActivity={dailyActivity} />
              </div>
            )}

            {/* Row 5: Time of Day Heatmap (full width) */}
            {dailyActivity.length > 0 && (
              <div className="mb-6">
                <TimeOfDayHeatmap dailyActivity={dailyActivity} />
              </div>
            )}

            {/* Row 6: Model Migration Timeline (full width) */}
            {tokenUsage.length > 0 && (
              <div className="mb-6">
                <ModelMigrationTimeline tokenUsage={tokenUsage} />
              </div>
            )}

            {/* Row 7: Fun Comparison (full width) */}
            {stats.totalTokens > 10000 && (
              <div className="mb-6">
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
