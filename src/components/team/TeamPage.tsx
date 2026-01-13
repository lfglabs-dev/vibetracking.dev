"use client";

import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
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
}

export function TeamPage({
  team,
  stats,
  dailyActivity,
  tokenUsage,
  memberStats,
  members,
}: TeamPageProps) {
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>("usd");

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        {/* Team Header */}
        <TeamHeader team={team} stats={stats} />

        {/* Stats Cards */}
        <TeamStatsCards stats={stats} memberCount={team.activeMemberCount} />

        {/* Unit Toggle */}
        <div className="flex justify-end mb-4">
          <UnitToggle value={displayUnit} onChange={setDisplayUnit} />
        </div>

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
        <div className="text-center mt-12 text-sm text-[#232323]/40">
          <p>
            Want to track your team&apos;s AI usage?{" "}
            <a href="/team/new" className="underline hover:text-[#232323]">
              Create a team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
