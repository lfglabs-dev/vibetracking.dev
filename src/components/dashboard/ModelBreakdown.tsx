"use client";

import { formatNumber } from "@/lib/utils";

interface ModelData {
  model: string;
  tokens: number;
}

interface ModelBreakdownProps {
  data: ModelData[];
}

const COLORS = ["#FEA6CC", "#B3D8F5", "#AAE7C0", "#F0F69B", "#E0C4FF"];

export function ModelBreakdown({ data }: ModelBreakdownProps) {
  if (data.length === 0) {
    return null;
  }

  const total = data.reduce((sum, item) => sum + item.tokens, 0);
  const sortedData = [...data].sort((a, b) => b.tokens - a.tokens);

  return (
    <div className="card">
      <h3 className="font-bold mb-4">Models Used</h3>
      <div className="space-y-3">
        {sortedData.slice(0, 5).map((item, index) => {
          const percentage = (item.tokens / total) * 100;
          return (
            <div key={item.model}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {formatModelName(item.model)}
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
                    backgroundColor: COLORS[index % COLORS.length],
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

function formatModelName(model: string): string {
  // Clean up model names for display
  const cleanModel = model
    .replace("claude-", "Claude ")
    .replace("gpt-", "GPT-")
    .replace("o1-", "O1-")
    .replace("-20", " (20")
    .replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3)")
    .replace("sonnet", "Sonnet")
    .replace("opus", "Opus")
    .replace("haiku", "Haiku")
    .replace("-latest", " Latest");

  return cleanModel;
}
