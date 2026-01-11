"use client";

import { useState } from "react";
import { LineChart, ChartCard, TOOL_COLORS, TOOL_LABELS } from "@/components/ui/charts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import type { DisplayUnit } from "./UnitToggle";
import { TimeframeSelector, type Timeframe } from "./TimeframeSelector";

interface DailyActivity {
  date: string;
  tool: string;
  totalTokens: number;
  cost: number;
}

interface UsageByToolChartProps {
  dailyActivity: DailyActivity[];
  unit: DisplayUnit;
}

// Map from shared Timeframe to local TimeRange for filtering
const TIMEFRAME_TO_DAYS: Record<Timeframe, number> = {
  "7d": 7,
  "30d": 30,
  "1y": 365,
  all: Infinity,
};

// Determine granularity based on date range
function getGranularity(days: number): "daily" | "weekly" | "monthly" {
  if (days <= 30) return "daily";
  if (days <= 180) return "weekly";
  return "monthly";
}

// Aggregate data by week or month
function aggregateData(
  data: DailyActivity[],
  granularity: "daily" | "weekly" | "monthly"
): DailyActivity[] {
  if (granularity === "daily") return data;

  const aggregated = new Map<string, Map<string, { tokens: number; cost: number }>>();

  data.forEach((item) => {
    const date = new Date(item.date);
    let key: string;

    if (granularity === "weekly") {
      // Get the Monday of the week
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      key = monday.toISOString().split("T")[0];
    } else {
      // Monthly - use first of month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    }

    if (!aggregated.has(key)) {
      aggregated.set(key, new Map());
    }
    const toolMap = aggregated.get(key)!;
    const existing = toolMap.get(item.tool) || { tokens: 0, cost: 0 };
    toolMap.set(item.tool, {
      tokens: existing.tokens + item.totalTokens,
      cost: existing.cost + item.cost,
    });
  });

  const result: DailyActivity[] = [];
  aggregated.forEach((toolMap, date) => {
    toolMap.forEach((data, tool) => {
      result.push({ date, tool, totalTokens: data.tokens, cost: data.cost });
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// Filter data by time range
function filterByTimeRange(data: DailyActivity[], timeframe: Timeframe): DailyActivity[] {
  if (timeframe === "all") return data;

  const now = new Date();
  const days = TIMEFRAME_TO_DAYS[timeframe];
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];
  return data.filter((d) => d.date >= cutoffStr);
}

export function UsageByToolChart({ dailyActivity, unit }: UsageByToolChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  if (!dailyActivity || dailyActivity.length === 0) {
    return null;
  }

  // Filter data by selected time range
  const filteredData = filterByTimeRange(dailyActivity, timeframe);

  // Get unique dates to determine granularity
  const uniqueDates = new Set(filteredData.map((d) => d.date));
  const daySpan = uniqueDates.size;
  const granularity = getGranularity(daySpan);

  // Aggregate data based on granularity
  const aggregatedData = aggregateData(filteredData, granularity);

  // Get unique tools
  const tools = [...new Set(aggregatedData.map((d) => d.tool))];

  // Transform data for recharts - one object per date with tool values as properties
  const dateMap = new Map<string, Record<string, string | number>>();
  aggregatedData.forEach((item) => {
    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, { date: item.date });
    }
    const entry = dateMap.get(item.date)!;

    if (unit === "usd") {
      // Use actual cost from database instead of estimating
      entry[item.tool] = item.cost;
    } else {
      entry[item.tool] = item.totalTokens;
    }
  });

  const chartData = Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );

  // Format date for x-axis based on granularity
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (granularity === "monthly") {
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Custom tooltip formatter
  const tooltipFormatter = (value: number | undefined, name: string | undefined): [string, string] => {
    if (value === undefined || name === undefined) return ["", ""];
    const label = TOOL_LABELS[name] || name;
    if (unit === "usd") {
      return [formatCurrency(value), label];
    }
    return [formatNumber(value) + " tokens", label];
  };

  const yAxisFormatter = (value: number) => {
    if (unit === "usd") {
      return "$" + formatNumber(value);
    }
    return formatNumber(value);
  };

  // Build line configs for the chart
  const lines = tools.map((tool) => ({
    dataKey: tool,
    color: TOOL_COLORS[tool] || "#232323",
    label: TOOL_LABELS[tool] || tool,
  }));

  return (
    <ChartCard
      title="Usage by IDE"
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
        legendFormatter={(value) => TOOL_LABELS[value] || value}
      />
    </ChartCard>
  );
}
