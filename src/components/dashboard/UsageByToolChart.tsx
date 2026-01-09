"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { estimateApiSpendUsd } from "@/lib/pricing";
import type { DisplayUnit } from "./UnitToggle";

interface DailyActivity {
  date: string;
  tool: string;
  totalTokens: number;
}

interface UsageByToolChartProps {
  dailyActivity: DailyActivity[];
  unit: DisplayUnit;
}

type TimeRange = "7D" | "30D" | "1Y";

// Tool colors matching the KPI cards design system - all 7 tools
const TOOL_COLORS: Record<string, string> = {
  claude_code: "#D63384", // Pink
  cursor: "#0D6EFD", // Blue
  codex: "#198754", // Green
  opencode: "#6F42C1", // Purple
  claude: "#FD7E14", // Orange
  gemini: "#20C997", // Teal
  amp: "#CC9A06", // Yellow
  droid: "#DC3545", // Red
};

const TOOL_LABELS: Record<string, string> = {
  claude_code: "Claude Code",
  cursor: "Cursor",
  codex: "Codex",
  opencode: "OpenCode",
  claude: "Claude",
  gemini: "Gemini",
  amp: "Amp",
  droid: "Droid",
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

  const aggregated = new Map<string, Map<string, number>>();

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
    toolMap.set(item.tool, (toolMap.get(item.tool) || 0) + item.totalTokens);
  });

  const result: DailyActivity[] = [];
  aggregated.forEach((toolMap, date) => {
    toolMap.forEach((tokens, tool) => {
      result.push({ date, tool, totalTokens: tokens });
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// Filter data by time range
function filterByTimeRange(data: DailyActivity[], range: TimeRange): DailyActivity[] {
  const now = new Date();
  let cutoffDate: Date;

  switch (range) {
    case "7D":
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30D":
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "1Y":
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const cutoffStr = cutoffDate.toISOString().split("T")[0];
  return data.filter((d) => d.date >= cutoffStr);
}

export function UsageByToolChart({ dailyActivity, unit }: UsageByToolChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30D");

  if (!dailyActivity || dailyActivity.length === 0) {
    return null;
  }

  // Filter data by selected time range
  const filteredData = filterByTimeRange(dailyActivity, timeRange);

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
      // Convert tokens to USD
      entry[item.tool] = estimateApiSpendUsd({ totalTokens: item.totalTokens });
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
    if (granularity === "weekly") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Custom tooltip formatter
  const tooltipFormatter = (value: number | undefined, name: string | undefined) => {
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

  const timeRangeOptions: TimeRange[] = ["7D", "30D", "1Y"];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Usage by IDE</h3>
        <div className="flex items-center gap-2">
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
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232323" strokeOpacity={0.1} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "#232323", fillOpacity: 0.5 }}
              tickLine={false}
              axisLine={{ stroke: "#232323", strokeOpacity: 0.1 }}
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 11, fill: "#232323", fillOpacity: 0.5 }}
              tickLine={false}
              axisLine={{ stroke: "#232323", strokeOpacity: 0.1 }}
              width={60}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={(label) => formatDate(label as string)}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #232323",
                borderRadius: "8px",
                boxShadow: "2px 2px 0 #232323",
              }}
            />
            <Legend
              formatter={(value) => TOOL_LABELS[value] || value}
              wrapperStyle={{ fontSize: 12 }}
            />
            {tools.map((tool) => (
              <Line
                key={tool}
                type="monotone"
                dataKey={tool}
                stroke={TOOL_COLORS[tool] || "#232323"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
