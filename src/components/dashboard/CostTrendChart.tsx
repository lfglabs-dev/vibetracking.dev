"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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

  // Format date for x-axis
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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
      <div className="bg-white border border-[#232323] rounded-lg p-3 shadow-[2px_2px_0_#232323]">
        <p className="font-bold text-sm mb-1">{formatDate(label)}</p>
        <p className="text-sm text-[#232323]/70">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  };

  const timeRangeOptions: TimeRange[] = ["7D", "30D", "90D"];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold">Cost Trend</h3>
          <p className="text-xs text-[#232323]/50 mt-0.5">
            Total: {formatCurrency(totalCost)} | Avg: {formatCurrency(avgCost)}/day
          </p>
        </div>
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
      </div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D63384" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D63384" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232323" strokeOpacity={0.1} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "#232323", fillOpacity: 0.5 }}
              tickLine={false}
              axisLine={{ stroke: "#232323", strokeOpacity: 0.1 }}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: "#232323", fillOpacity: 0.5 }}
              tickLine={false}
              axisLine={{ stroke: "#232323", strokeOpacity: 0.1 }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#D63384"
              strokeWidth={2}
              fill="url(#costGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
