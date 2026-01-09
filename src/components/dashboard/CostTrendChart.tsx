"use client";

import { useState } from "react";
import { AreaChart, ChartCard, ChartTooltip } from "@/components/ui/charts";
import { formatCurrency } from "@/lib/utils";

interface DailyActivity {
  date: string;
  cost: number;
}

interface CostTrendChartProps {
  dailyActivity: DailyActivity[];
}

type TimeRange = "7D" | "30D" | "90D";

// Aggregate data by date (sum costs across all tools)
function aggregateByDate(data: DailyActivity[]): { date: string; cost: number }[] {
  const dateMap = new Map<string, number>();

  data.forEach((item) => {
    dateMap.set(item.date, (dateMap.get(item.date) || 0) + item.cost);
  });

  return Array.from(dateMap.entries())
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Filter data by time range
function filterByTimeRange(
  data: { date: string; cost: number }[],
  range: TimeRange
): { date: string; cost: number }[] {
  const now = new Date();
  let cutoffDate: Date;

  switch (range) {
    case "7D":
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30D":
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90D":
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
  }

  const cutoffStr = cutoffDate.toISOString().split("T")[0];
  return data.filter((d) => d.date >= cutoffStr);
}

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function CostTrendChart({ dailyActivity }: CostTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30D");

  if (!dailyActivity || dailyActivity.length === 0) {
    return null;
  }

  // Aggregate by date first
  const aggregatedData = aggregateByDate(dailyActivity);

  // Filter by time range
  const filteredData = filterByTimeRange(aggregatedData, timeRange);

  if (filteredData.length === 0) {
    return null;
  }

  // Calculate totals
  const totalCost = filteredData.reduce((sum, d) => sum + d.cost, 0);
  const avgCost = totalCost / filteredData.length;

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length || !label) return null;
    return (
      <ChartTooltip
        title={formatDate(label)}
        value={formatCurrency(payload[0].value)}
      />
    );
  };

  const timeRangeOptions: TimeRange[] = ["7D", "30D", "90D"];

  const TimeRangeSelector = (
    <div className="flex rounded-lg border border-[#232323]/20 overflow-hidden">
      {timeRangeOptions.map((range) => (
        <button
          key={range}
          onClick={() => setTimeRange(range)}
          className={`px-2.5 py-1 text-xs font-medium transition-colors ${
            timeRange === range
              ? "bg-[#232323] text-white"
              : "bg-white text-[#232323]/70 hover:bg-[#232323]/5"
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Cost Trend"
      subtitle={`Total: ${formatCurrency(totalCost)} | Avg: ${formatCurrency(avgCost)}/day`}
      rightSlot={TimeRangeSelector}
      height={250}
    >
      <AreaChart
        data={filteredData}
        dataKey="cost"
        xAxisKey="date"
        color="#D63384"
        gradient
        gradientId="costTrendGradient"
        xAxisFormatter={formatDate}
        yAxisFormatter={(v) => `$${v}`}
        tooltipContent={<CustomTooltip />}
        height={250}
      />
    </ChartCard>
  );
}
