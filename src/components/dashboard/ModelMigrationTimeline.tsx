"use client";

import { useMemo, useState } from "react";
import { StackedAreaChart, ChartCard, getColorFromString, MODEL_COLORS } from "@/components/ui/charts";
import { formatModelName } from "@/lib/formatModelName";
import { TimeframeSelector, filterByTimeframe, type Timeframe } from "./TimeframeSelector";

interface TokenUsage {
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

interface ModelMigrationTimelineProps {
  tokenUsage: TokenUsage[];
}

// Color palette for specific models (overrides)
const SPECIFIC_MODEL_COLORS: Record<string, string> = {
  "claude-sonnet-4-20250514": "#D63384",
  "claude-opus-4-20250514": "#6F42C1",
  "claude-haiku-3-5-20241022": "#FD7E14",
  "gpt-4o": "#198754",
  "gpt-4o-mini": "#20C997",
  "o1-mini": "#0D6EFD",
  "o3-mini": "#B3D8F5",
  "gemini-2.0-flash": "#CC9A06",
  "deepseek-v3": "#DC3545",
};

// Get a deterministic color for any model
function getModelColor(model: string): string {
  if (SPECIFIC_MODEL_COLORS[model]) return SPECIFIC_MODEL_COLORS[model];
  return getColorFromString(model, MODEL_COLORS);
}

// Models to exclude from the timeline chart (synthetic/placeholder entries)
const EXCLUDED_MODELS = new Set([
  "<synthetic>",
  "auto",
  "unknown",
  "cursor-small",
  "agent_review",
  "composer-1",
]);

// Aggregate data by week and model
function aggregateByWeekAndModel(
  data: TokenUsage[]
): { week: string; [model: string]: number | string }[] {
  const weekMap = new Map<string, Map<string, number>>();

  data.forEach((item) => {
    if (EXCLUDED_MODELS.has(item.model)) return;

    const date = new Date(item.date);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    const weekKey = monday.toISOString().split("T")[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, new Map());
    }
    const modelMap = weekMap.get(weekKey)!;
    const tokens = item.inputTokens + item.outputTokens +
                   (item.cacheReadTokens || 0) + (item.cacheCreationTokens || 0);
    modelMap.set(item.model, (modelMap.get(item.model) || 0) + tokens);
  });

  const result: { week: string; [model: string]: number | string }[] = [];
  weekMap.forEach((modelMap, week) => {
    const entry: { week: string; [model: string]: number | string } = { week };
    modelMap.forEach((tokens, model) => {
      entry[model] = tokens;
    });
    result.push(entry);
  });

  return result.sort((a, b) => (a.week as string).localeCompare(b.week as string));
}

// Format week for x-axis
const formatWeek = (weekStr: string) => {
  const date = new Date(weekStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function ModelMigrationTimeline({ tokenUsage }: ModelMigrationTimelineProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("all");

  const { chartData, models } = useMemo(() => {
    if (!tokenUsage || tokenUsage.length === 0) {
      return { chartData: [], models: [] };
    }

    const filteredUsage = filterByTimeframe(tokenUsage, timeframe);
    const aggregated = aggregateByWeekAndModel(filteredUsage);

    const modelSet = new Set<string>();
    aggregated.forEach((week) => {
      Object.keys(week).forEach((key) => {
        if (key !== "week" && !EXCLUDED_MODELS.has(key)) modelSet.add(key);
      });
    });

    const modelTotals = new Map<string, number>();
    filteredUsage.forEach((item) => {
      if (EXCLUDED_MODELS.has(item.model)) return;
      const tokens = item.inputTokens + item.outputTokens +
                     (item.cacheReadTokens || 0) + (item.cacheCreationTokens || 0);
      modelTotals.set(item.model, (modelTotals.get(item.model) || 0) + tokens);
    });

    const sortedModels = [...modelSet].sort(
      (a, b) => (modelTotals.get(b) || 0) - (modelTotals.get(a) || 0)
    );

    return { chartData: aggregated, models: sortedModels.slice(0, 6) };
  }, [tokenUsage, timeframe]);

  if (!tokenUsage || tokenUsage.length === 0 || chartData.length < 2) {
    return null;
  }

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length || !label) return null;

    const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);

    return (
      <div className="bg-white border border-[#232323] rounded-lg p-3 shadow-[2px_2px_0_#232323] max-w-xs">
        <p className="font-bold text-sm mb-2">Week of {formatWeek(label)}</p>
        <div className="space-y-1">
          {payload
            .filter((p) => p.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-[#232323]/70">{formatModelName(p.name)}</span>
                </div>
                <span className="font-medium">
                  {((p.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // Build area configs
  const areas = models.map((model) => ({
    dataKey: model,
    color: getModelColor(model),
    label: formatModelName(model),
  }));

  return (
    <ChartCard
      title="Model Usage Over Time"
      rightSlot={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
      height={280}
    >
      <StackedAreaChart
        data={chartData}
        areas={areas}
        xAxisKey="week"
        normalized
        xAxisFormatter={formatWeek}
        tooltipContent={<CustomTooltip />}
        showLegend
        legendFormatter={(value) => formatModelName(value)}
        height={280}
      />
    </ChartCard>
  );
}
