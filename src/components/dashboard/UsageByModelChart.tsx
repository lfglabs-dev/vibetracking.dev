"use client";

import { useState } from "react";
import { BarChart, ChartCard, ChartTooltip, MODEL_COLORS } from "@/components/ui/charts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { estimateApiSpendUsd } from "@/lib/pricing";
import { formatModelName } from "@/lib/formatModelName";
import type { DisplayUnit } from "./UnitToggle";
import { TimeframeSelector, filterByTimeframe, type Timeframe } from "./TimeframeSelector";

interface TokenUsage {
  date: string;
  tool: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  reasoningTokens?: number;
  cost: number;
}

interface UsageByModelChartProps {
  tokenUsage: TokenUsage[];
  unit: DisplayUnit;
}

// Models to exclude from charts (synthetic/placeholder entries)
const EXCLUDED_MODELS = new Set([
  "<synthetic>",
  "auto",
  "unknown",
  "cursor-small",
  "agent_review",
  "composer-1",
]);

export function UsageByModelChart({ tokenUsage, unit }: UsageByModelChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("all");

  if (!tokenUsage || tokenUsage.length === 0) {
    return null;
  }

  // Filter by timeframe
  const filteredUsage = filterByTimeframe(tokenUsage, timeframe);

  // Aggregate totals by model (excluding synthetic/placeholder models)
  const modelTotals = new Map<string, { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number; cost: number }>();
  filteredUsage.forEach((item) => {
    if (EXCLUDED_MODELS.has(item.model)) return;
    const hasTokens = item.inputTokens > 0 || item.outputTokens > 0 ||
                      (item.cacheReadTokens || 0) > 0 || (item.cacheCreationTokens || 0) > 0;
    if (!hasTokens && item.cost === 0) return;

    const existing = modelTotals.get(item.model) || { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, cost: 0 };
    modelTotals.set(item.model, {
      inputTokens: existing.inputTokens + item.inputTokens,
      outputTokens: existing.outputTokens + item.outputTokens,
      cacheReadTokens: existing.cacheReadTokens + (item.cacheReadTokens || 0),
      cacheCreationTokens: existing.cacheCreationTokens + (item.cacheCreationTokens || 0),
      cost: existing.cost + item.cost,
    });
  });

  // Create chart data sorted by total usage
  const chartData = [...modelTotals.entries()]
    .map(([model, totals]) => {
      const totalTokens = totals.inputTokens + totals.outputTokens +
                          totals.cacheReadTokens + totals.cacheCreationTokens;
      const value = unit === "usd"
        ? (totals.cost > 0 ? totals.cost : estimateApiSpendUsd({ model, totalTokens }))
        : totalTokens;
      return {
        name: formatModelName(model),
        model,
        value,
        totalTokens,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const xAxisFormatter = (value: number) => {
    if (unit === "usd") {
      return "$" + formatNumber(value);
    }
    return formatNumber(value);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <ChartTooltip
        title={data.name}
        value={unit === "usd" ? formatCurrency(data.value) : formatNumber(data.value) + " tokens"}
      />
    );
  };

  // Handle empty filtered data
  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Usage by Model"
        rightSlot={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
      >
        <div className="h-full flex items-center justify-center text-[#232323]/40 text-sm">
          No data for selected timeframe
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Usage by Model"
      rightSlot={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        colors={MODEL_COLORS}
        xAxisFormatter={xAxisFormatter}
        tooltipContent={<CustomTooltip />}
      />
    </ChartCard>
  );
}
