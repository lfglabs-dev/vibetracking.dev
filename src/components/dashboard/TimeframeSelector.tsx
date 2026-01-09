"use client";

export type Timeframe = "7d" | "30d" | "1y" | "all";

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  compact?: boolean;
}

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "7d": "7D",
  "30d": "30D",
  "1y": "1Y",
  all: "All",
};

export function TimeframeSelector({ value, onChange, compact = false }: TimeframeSelectorProps) {
  const timeframes: Timeframe[] = ["7d", "30d", "1y", "all"];

  return (
    <div className="flex items-center gap-0.5 bg-[#EEF0F2] rounded-full p-0.5 border border-[#232323]/10">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all ${
            value === tf
              ? "bg-white text-[#232323] shadow-sm"
              : "text-[#232323]/60 hover:text-[#232323]"
          }`}
        >
          {TIMEFRAME_LABELS[tf]}
        </button>
      ))}
    </div>
  );
}

// Helper to filter data by timeframe
export function filterByTimeframe<T extends { date: string }>(
  data: T[],
  timeframe: Timeframe
): T[] {
  if (timeframe === "all") return data;

  const now = new Date();
  const cutoff = new Date();

  switch (timeframe) {
    case "7d":
      cutoff.setDate(now.getDate() - 7);
      break;
    case "30d":
      cutoff.setDate(now.getDate() - 30);
      break;
    case "1y":
      cutoff.setFullYear(now.getFullYear() - 1);
      break;
  }

  const cutoffStr = cutoff.toISOString().split("T")[0];
  return data.filter((item) => item.date >= cutoffStr);
}
