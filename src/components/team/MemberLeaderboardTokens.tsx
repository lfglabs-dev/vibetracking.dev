"use client";

import { formatNumber, formatCurrency } from "@/lib/utils";
import type { DisplayUnit } from "@/components/dashboard/UnitToggle";

interface Member {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalTokens: number;
  totalCost: number;
}

interface MemberLeaderboardTokensProps {
  members: Member[];
  title: string;
  unit: DisplayUnit;
}

export function MemberLeaderboardTokens({
  members,
  title,
  unit,
}: MemberLeaderboardTokensProps) {
  // Sort by the selected unit
  const sortedMembers = [...members].sort((a, b) => {
    if (unit === "usd") {
      return b.totalCost - a.totalCost;
    }
    return b.totalTokens - a.totalTokens;
  });

  const topMembers = sortedMembers.slice(0, 10);

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  };

  return (
    <div className="card">
      <h3 className="font-bold mb-4">{title}</h3>
      {topMembers.length === 0 ? (
        <div className="text-center text-[#232323]/40 py-8">
          No member data yet
        </div>
      ) : (
        <div className="space-y-2">
          {topMembers.map((member, index) => (
            <a
              key={member.userId}
              href={`/@${member.username}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#232323]/5 transition-colors"
            >
              {/* Rank */}
              <div className="w-8 text-center">
                <span
                  className={`text-sm font-bold ${
                    index === 0
                      ? "text-yellow-500"
                      : index === 1
                      ? "text-gray-400"
                      : index === 2
                      ? "text-amber-600"
                      : "text-[#232323]/40"
                  }`}
                >
                  {getMedalEmoji(index + 1)}
                </span>
              </div>

              {/* Avatar */}
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.displayName || member.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#FEA6CC] flex items-center justify-center text-sm font-bold text-white">
                  {(member.displayName || member.username).charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {member.displayName || member.username}
                </div>
                <div className="text-xs text-[#232323]/60 truncate">
                  @{member.username}
                </div>
              </div>

              {/* Value */}
              <div className="text-right">
                <div className="font-bold text-[#238636]">
                  {unit === "usd"
                    ? formatCurrency(member.totalCost)
                    : formatNumber(member.totalTokens)}
                </div>
                <div className="text-xs text-[#232323]/40">
                  {unit === "usd" ? "spent" : "tokens"}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
