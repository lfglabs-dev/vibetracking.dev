"use client";

import { formatNumber, formatDuration, type ImportData, getAggregatedStats } from "@/lib/utils";

interface StatsPreviewProps {
  data: ImportData;
}

export function StatsPreview({ data }: StatsPreviewProps) {
  const stats = getAggregatedStats(data);

  const toolLabels: Record<string, { icon: string; label: string; color: string }> = {
    claude_code: { icon: "🤖", label: "Claude Code", color: "bg-[#FEA6CC]" },
    claude: { icon: "🧠", label: "Claude", color: "bg-[#FEA6CC]" },
    codex: { icon: "💻", label: "Codex", color: "bg-[#B3D8F5]" },
    cursor: { icon: "📝", label: "Cursor", color: "bg-[#F0F69B]" },
    opencode: { icon: "📦", label: "OpenCode", color: "bg-[#AAE7C0]" },
    gemini: { icon: "✨", label: "Gemini", color: "bg-[#F7C59F]" },
    amp: { icon: "⚡", label: "Amp", color: "bg-[#C5B3F5]" },
    droid: { icon: "🤖", label: "Droid", color: "bg-[#D9D9D9]" },
  };

  return (
    <div className="space-y-6">
      {/* Tools found */}
      <div>
        <h3 className="text-sm font-semibold uppercase mb-3 text-[#232323]/70">
          Tools Found
        </h3>
        <div className="flex flex-wrap gap-2">
          {stats.toolsFound.map((tool) => {
            const toolInfo = toolLabels[tool] ?? {
              icon: "✨",
              label: tool,
              color: "bg-[#E6E6E6]",
            };
            return (
              <span
                key={tool}
                className={`tag ${toolInfo.color}`}
              >
                {toolInfo.icon} {toolInfo.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="text-sm text-[#232323]/70 uppercase font-medium">
            Total Tokens
          </div>
          <div className="text-3xl font-black text-[#232323]">
            {formatNumber(stats.totalTokens)}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-[#232323]/70 uppercase font-medium">
            Sessions
          </div>
          <div className="text-3xl font-black text-[#232323]">
            {stats.totalSessions}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-[#232323]/70 uppercase font-medium">
            Messages
          </div>
          <div className="text-3xl font-black text-[#232323]">
            {formatNumber(stats.totalMessages)}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-[#232323]/70 uppercase font-medium">
            Longest Session
          </div>
          <div className="text-3xl font-black text-[#232323]">
            {stats.longestSessionMs > 0 ? formatDuration(stats.longestSessionMs) : "N/A"}
          </div>
        </div>
      </div>

      {/* Favorite model */}
      {stats.favoriteModel && (
        <div className="card bg-[#AAE7C0]">
          <div className="text-sm text-[#232323]/70 uppercase font-medium">
            Favorite Model
          </div>
          <div className="text-xl font-bold text-[#232323] truncate">
            {stats.favoriteModel.replace(/-/g, " ").replace(/\d{8}$/, "")}
          </div>
        </div>
      )}
    </div>
  );
}
