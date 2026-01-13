"use client";

import { useState, useMemo } from "react";
import { LineChart, ChartCard, MODEL_COLORS, getColorFromString } from "@/components/ui/charts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { formatModelName } from "@/lib/formatModelName";
import { TimeframeSelector, type Timeframe, filterByTimeframe } from "@/components/dashboard/TimeframeSelector";
import type { DisplayUnit } from "@/components/dashboard/UnitToggle";
import { MODEL_RELEASES } from "@/lib/model-releases";

interface TokenUsageData {
  date: string;
  model: string;
  tokens: number;
  cost: number;
}

interface TeamTokensChartProps {
  tokenUsage: TokenUsageData[];
  unit: DisplayUnit;
}

// Determine granularity based on date range
function getGranularity(days: number): "daily" | "weekly" | "monthly" {
  if (days <= 30) return "daily";
  if (days <= 180) return "weekly";
  return "monthly";
}

// Aggregate data by week or month
function aggregateData(
  data: TokenUsageData[],
  granularity: "daily" | "weekly" | "monthly"
): TokenUsageData[] {
  if (granularity === "daily") return data;

  const aggregated = new Map<string, Map<string, { tokens: number; cost: number }>>();

  data.forEach((item) => {
    const date = new Date(item.date);
    let key: string;

    if (granularity === "weekly") {
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      key = monday.toISOString().split("T")[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    }

    if (!aggregated.has(key)) {
      aggregated.set(key, new Map());
    }
    const modelMap = aggregated.get(key)!;
    const existing = modelMap.get(item.model) || { tokens: 0, cost: 0 };
    modelMap.set(item.model, {
      tokens: existing.tokens + item.tokens,
      cost: existing.cost + item.cost,
    });
  });

  const result: TokenUsageData[] = [];
  aggregated.forEach((modelMap, date) => {
    modelMap.forEach((data, model) => {
      result.push({ date, model, tokens: data.tokens, cost: data.cost });
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export function TeamTokensChart({ tokenUsage, unit }: TeamTokensChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  // Transform data for filtering
  const dataForFilter = useMemo(() => {
    return tokenUsage.map((t) => ({
      date: t.date,
      total: t.tokens,
    }));
  }, [tokenUsage]);

  // Filter by timeframe
  const filteredDates = useMemo(() => {
    const filtered = filterByTimeframe(dataForFilter, timeframe);
    return new Set(filtered.map((f) => f.date));
  }, [dataForFilter, timeframe]);

  const filteredData = useMemo(() => {
    return tokenUsage.filter((t) => filteredDates.has(t.date));
  }, [tokenUsage, filteredDates]);

  // Get top models by total usage
  const topModels = useMemo(() => {
    const modelTotals = new Map<string, number>();
    filteredData.forEach((t) => {
      const current = modelTotals.get(t.model) || 0;
      modelTotals.set(t.model, current + (unit === "usd" ? t.cost : t.tokens));
    });

    return Array.from(modelTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([model]) => model);
  }, [filteredData, unit]);

  // Determine granularity
  const granularity = useMemo(() => {
    const uniqueDates = new Set(filteredData.map((d) => d.date));
    return getGranularity(uniqueDates.size);
  }, [filteredData]);

  // Filter to only top models and aggregate
  const aggregatedData = useMemo(() => {
    const topModelSet = new Set(topModels);
    const filtered = filteredData.filter((t) => topModelSet.has(t.model));
    return aggregateData(filtered, granularity);
  }, [filteredData, topModels, granularity]);

  // Transform for chart
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, string | number>>();

    aggregatedData.forEach((item) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date });
      }
      const entry = dateMap.get(item.date)!;
      entry[item.model] = unit === "usd" ? item.cost : item.tokens;
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      (a.date as string).localeCompare(b.date as string)
    );
  }, [aggregatedData, unit]);

  // Reference lines for model releases
  const referenceLines = useMemo(() => {
    if (chartData.length === 0) return [];

    const dates = chartData.map((d) => d.date as string);
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    return MODEL_RELEASES.filter(
      (release) => release.date >= minDate && release.date <= maxDate
    ).map((release) => ({
      x: release.date,
      label: release.label,
      color: release.color,
    }));
  }, [chartData]);

  if (!tokenUsage || tokenUsage.length === 0) {
    return (
      <ChartCard title="Team Token Usage Over Time">
        <div className="h-60 flex items-center justify-center text-[#232323]/40">
          No usage data yet
        </div>
      </ChartCard>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (granularity === "monthly") {
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const yAxisFormatter = (value: number) => {
    if (unit === "usd") {
      return "$" + formatNumber(value);
    }
    return formatNumber(value);
  };

  const tooltipFormatter = (value: number | undefined, name: string | undefined): [string, string] => {
    if (value === undefined || name === undefined) return ["", ""];
    const label = formatModelName(name);
    if (unit === "usd") {
      return [formatCurrency(value), label];
    }
    return [formatNumber(value) + " tokens", label];
  };

  // Build lines
  const lines = topModels.map((model, index) => ({
    dataKey: model,
    color: MODEL_COLORS[index] || getColorFromString(model),
    label: formatModelName(model),
  }));

  return (
    <ChartCard
      title="Team Token Usage by Model"
      subtitle="Aggregated usage across all team members"
      rightSlot={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
    >
      <LineChart
        data={chartData}
        lines={lines}
        xAxisKey="date"
        xAxisFormatter={formatDate}
        yAxisFormatter={yAxisFormatter}
        tooltipFormatter={tooltipFormatter}
        tooltipLabelFormatter={formatDate}
        legendFormatter={(value) => formatModelName(value)}
        referenceLines={referenceLines}
        showLegend
      />
    </ChartCard>
  );
}
