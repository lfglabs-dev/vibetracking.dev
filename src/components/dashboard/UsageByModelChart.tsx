"use client";

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
import { formatModelName } from "@/lib/formatModelName";
import type { DisplayUnit } from "./UnitToggle";

interface TokenUsage {
  date: string;
  tool: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface UsageByModelChartProps {
  tokenUsage: TokenUsage[];
  unit: DisplayUnit;
}

// Color palette for models
const MODEL_COLORS = [
  "#FEA6CC", // Pink
  "#AAE7C0", // Green
  "#B3D8F5", // Blue
  "#F0F69B", // Yellow
  "#D4A5FF", // Purple
  "#FFB366", // Orange
  "#85E0E0", // Cyan
  "#FF9999", // Coral
];

// Determine granularity based on date range
function getGranularity(days: number): "daily" | "weekly" | "monthly" {
  if (days <= 30) return "daily";
  if (days <= 180) return "weekly";
  return "monthly";
}

// Aggregate data by week or month
function aggregateData(
  data: TokenUsage[],
  granularity: "daily" | "weekly" | "monthly"
): { date: string; model: string; totalTokens: number }[] {
  // First, aggregate by date and model (across all tools)
  const byDateModel = new Map<string, Map<string, number>>();

  data.forEach((item) => {
    const totalTokens = item.inputTokens + item.outputTokens;
    let dateKey = item.date;

    if (granularity === "weekly") {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      dateKey = monday.toISOString().split("T")[0];
    } else if (granularity === "monthly") {
      const date = new Date(item.date);
      dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    }

    if (!byDateModel.has(dateKey)) {
      byDateModel.set(dateKey, new Map());
    }
    const modelMap = byDateModel.get(dateKey)!;
    modelMap.set(item.model, (modelMap.get(item.model) || 0) + totalTokens);
  });

  const result: { date: string; model: string; totalTokens: number }[] = [];
  byDateModel.forEach((modelMap, date) => {
    modelMap.forEach((tokens, model) => {
      result.push({ date, model, totalTokens: tokens });
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}


export function UsageByModelChart({ tokenUsage, unit }: UsageByModelChartProps) {
  if (!tokenUsage || tokenUsage.length === 0) {
    return null;
  }

  // Get unique dates to determine granularity
  const uniqueDates = new Set(tokenUsage.map((d) => d.date));
  const daySpan = uniqueDates.size;
  const granularity = getGranularity(daySpan);

  // Aggregate data based on granularity
  const aggregatedData = aggregateData(tokenUsage, granularity);

  // Get unique models and sort by total usage
  const modelTotals = new Map<string, number>();
  aggregatedData.forEach((item) => {
    modelTotals.set(item.model, (modelTotals.get(item.model) || 0) + item.totalTokens);
  });
  const models = [...modelTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8) // Limit to top 8 models
    .map(([model]) => model);

  // Assign colors to models
  const modelColorMap: Record<string, string> = {};
  models.forEach((model, index) => {
    modelColorMap[model] = MODEL_COLORS[index % MODEL_COLORS.length];
  });

  // Transform data for recharts - one object per date with model values as properties
  const dateMap = new Map<string, Record<string, number | string>>();
  aggregatedData.forEach((item) => {
    if (!models.includes(item.model)) return; // Skip models not in top 8

    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, { date: item.date });
    }
    const entry = dateMap.get(item.date)!;

    if (unit === "usd") {
      entry[item.model] = estimateApiSpendUsd({
        model: item.model,
        totalTokens: item.totalTokens,
      });
    } else {
      entry[item.model] = item.totalTokens;
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
    const label = formatModelName(name);
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

  const granularityLabel = granularity === "daily" ? "Daily" : granularity === "weekly" ? "Weekly" : "Monthly";

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Usage by Model</h3>
        <span className="text-xs text-[#232323]/50">{granularityLabel}</span>
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
              formatter={(value) => formatModelName(value)}
              wrapperStyle={{ fontSize: 11 }}
            />
            {models.map((model) => (
              <Line
                key={model}
                type="monotone"
                dataKey={model}
                stroke={modelColorMap[model]}
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
