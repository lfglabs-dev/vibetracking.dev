"use client";

import { formatNumber } from "@/lib/utils";

interface ToolData {
  tool: string;
  tokens: number;
}

interface ToolBreakdownProps {
  data: ToolData[];
}

const TOOL_COLORS: Record<string, string> = {
  claude_code: "#FEA6CC",
  codex: "#AAE7C0",
  cursor: "#B3D8F5",
};

const TOOL_NAMES: Record<string, string> = {
  claude_code: "Claude Code",
  codex: "Codex",
  cursor: "Cursor",
};

export function ToolBreakdown({ data }: ToolBreakdownProps) {
  if (data.length === 0) {
    return null;
  }

  const total = data.reduce((sum, item) => sum + item.tokens, 0);
  const sortedData = [...data].sort((a, b) => b.tokens - a.tokens);

  return (
    <div className="card">
      <h3 className="font-bold mb-4">Tools Used</h3>
      <div className="space-y-3">
        {sortedData.map((item) => {
          const percentage = (item.tokens / total) * 100;
          return (
            <div key={item.tool}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  {TOOL_NAMES[item.tool] || item.tool}
                </span>
                <span className="text-sm text-[#232323]/60">
                  {formatNumber(item.tokens)} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 bg-[#EEF0F2] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: TOOL_COLORS[item.tool] || "#AAE7C0",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
