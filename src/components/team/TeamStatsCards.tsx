"use client";

import { formatNumber, formatCurrency } from "@/lib/utils";
import { formatModelName } from "@/lib/formatModelName";
import { TOOL_LABELS } from "@/components/ui/charts/constants";

interface TeamStatsCardsProps {
  stats: {
    totalTokens: number;
    totalCost: number;
    totalSessions: number;
    favoriteModel: string | null;
    favoriteTool: string | null;
  };
  memberCount: number;
}

export function TeamStatsCards({ stats, memberCount }: TeamStatsCardsProps) {
  const avgCostPerMember = memberCount > 0 ? stats.totalCost / memberCount : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="card text-center">
        <div className="text-3xl font-black text-[#238636]">
          {formatCurrency(stats.totalCost)}
        </div>
        <div className="text-sm text-[#232323]/60">Total Spend</div>
      </div>

      <div className="card text-center">
        <div className="text-3xl font-black text-[#AAE7C0]">
          {formatNumber(stats.totalTokens)}
        </div>
        <div className="text-sm text-[#232323]/60">Total Tokens</div>
      </div>

      <div className="card text-center">
        <div className="text-3xl font-black text-[#FEA6CC]">
          {formatCurrency(avgCostPerMember)}
        </div>
        <div className="text-sm text-[#232323]/60">Avg per Member</div>
      </div>

      <div className="card text-center">
        <div className="text-xl font-black text-[#232323] truncate px-2">
          {stats.favoriteModel
            ? formatModelName(stats.favoriteModel)
            : "—"}
        </div>
        <div className="text-sm text-[#232323]/60">Top Model</div>
        {stats.favoriteTool && (
          <div className="text-xs text-[#232323]/40 mt-1">
            via {TOOL_LABELS[stats.favoriteTool as keyof typeof TOOL_LABELS] || stats.favoriteTool}
          </div>
        )}
      </div>
    </div>
  );
}
