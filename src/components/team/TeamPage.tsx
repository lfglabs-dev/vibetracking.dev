"use client";

import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { AnimatedSticker } from "@/components/shared/AnimatedSticker";
import { TeamHeader } from "./TeamHeader";
import { TeamStatsCards } from "./TeamStatsCards";
import { TeamTokensChart } from "./TeamTokensChart";
import { TeamToolsModels } from "./TeamToolsModels";
import { MemberLeaderboardTokens } from "./MemberLeaderboardTokens";
import { UnitToggle, type DisplayUnit } from "@/components/dashboard/UnitToggle";

interface TeamPageProps {
  team: {
    id: string;
    slug: string;
    name: string;
    avatarUrl: string | null;
    description: string | null;
    memberCount: number;
    activeMemberCount: number;
    isPublic: boolean;
  };
  stats: {
    totalTokens: number;
    totalCost: number;
    totalSessions: number;
    favoriteModel: string | null;
    favoriteTool: string | null;
  };
  dailyActivity: Array<{
    date: string;
    tool: string;
    totalTokens: number;
    cost: number;
  }>;
  tokenUsage: Array<{
    date: string;
    model: string;
    tokens: number;
    cost: number;
  }>;
  memberStats: Array<{
    userId: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    totalTokens: number;
    totalCost: number;
  }>;
  members: Array<{
    githubUsername: string;
    isActive: boolean;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    role: string;
  }>;
  isAdmin: boolean;
}

export function TeamPage({
  team,
  stats,
  dailyActivity,
  tokenUsage,
  memberStats,
  members,
  isAdmin,
}: TeamPageProps) {
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>("usd");

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
          {/* Stats section */}
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
          {/* Charts section */}
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
          {/* Tools & Models section */}
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
          {/* Leaderboard section */}
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
          {/* Footer section */}
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
        <header className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <UnitToggle value={displayUnit} onChange={setDisplayUnit} />
          </div>
        </header>

        {/* Team Header */}
        <TeamHeader team={team} stats={stats} isAdmin={isAdmin} />

        {/* Stats Cards */}
        <TeamStatsCards stats={stats} memberCount={team.activeMemberCount} />

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Team Tokens Over Time */}
          <TeamTokensChart tokenUsage={tokenUsage} unit={displayUnit} />

          {/* Tools & Models Breakdown */}
          <TeamToolsModels
            dailyActivity={dailyActivity}
            tokenUsage={tokenUsage}
            unit={displayUnit}
          />

          {/* Member Leaderboard */}
          <div className="grid md:grid-cols-2 gap-6">
            <MemberLeaderboardTokens
              members={memberStats}
              title="Top Contributors by Spend"
              unit={displayUnit}
            />
            <div className="card">
              <h3 className="font-bold mb-4">Team Members</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.githubUsername}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#232323]/5"
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName || member.githubUsername}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#FEA6CC] flex items-center justify-center text-sm font-bold text-white">
                        {(member.displayName || member.githubUsername)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {member.displayName || member.githubUsername}
                      </div>
                      <div className="text-xs text-[#232323]/60 truncate">
                        @{member.username || member.githubUsername}
                      </div>
                    </div>
                    {member.isActive ? (
                      <span className="tag tag-green text-xs">Active</span>
                    ) : (
                      <span className="tag text-xs">Invite</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-[#232323]/50">
          <p>Track your team&apos;s AI coding vibes</p>
        </footer>
        </div>
      </div>
    </div>
  );
}
