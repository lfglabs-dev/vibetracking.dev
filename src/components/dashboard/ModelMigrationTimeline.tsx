"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatModelName } from "@/lib/formatModelName";

interface TokenUsage {
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface ModelMigrationTimelineProps {
  tokenUsage: TokenUsage[];
}

// Color palette for models
const MODEL_COLORS: Record<string, string> = {
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
  if (MODEL_COLORS[model]) return MODEL_COLORS[model];
  // Hash the model name to get a consistent color
  let hash = 0;
  for (let i = 0; i < model.length; i++) {
    hash = model.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = Object.values(MODEL_COLORS);
  return colors[Math.abs(hash) % colors.length];
}

// Aggregate data by week and model
function aggregateByWeekAndModel(
  data: TokenUsage[]
): { week: string; [model: string]: number | string }[] {
  const weekMap = new Map<string, Map<string, number>>();

  data.forEach((item) => {
    const date = new Date(item.date);
    // Get Monday of the week
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    const weekKey = monday.toISOString().split("T")[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, new Map());
    }
    const modelMap = weekMap.get(weekKey)!;
    const tokens = item.inputTokens + item.outputTokens;
    modelMap.set(item.model, (modelMap.get(item.model) || 0) + tokens);
  });

  // Convert to array format for recharts
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

export function ModelMigrationTimeline({ tokenUsage }: ModelMigrationTimelineProps) {
  const { chartData, models } = useMemo(() => {
    if (!tokenUsage || tokenUsage.length === 0) {
      return { chartData: [], models: [] };
    }

    const aggregated = aggregateByWeekAndModel(tokenUsage);

    // Get all unique models
    const modelSet = new Set<string>();
    aggregated.forEach((week) => {
      Object.keys(week).forEach((key) => {
        if (key !== "week") modelSet.add(key);
      });
    });

    // Sort models by total usage
    const modelTotals = new Map<string, number>();
    tokenUsage.forEach((item) => {
      const tokens = item.inputTokens + item.outputTokens;
      modelTotals.set(item.model, (modelTotals.get(item.model) || 0) + tokens);
    });

    const sortedModels = [...modelSet].sort(
      (a, b) => (modelTotals.get(b) || 0) - (modelTotals.get(a) || 0)
    );

    // Limit to top 6 models for readability
    const topModels = sortedModels.slice(0, 6);

    return { chartData: aggregated, models: topModels };
  }, [tokenUsage]);

  if (!tokenUsage || tokenUsage.length === 0 || chartData.length < 2) {
    return null;
  }

  // Format week for x-axis
  const formatWeek = (weekStr: string) => {
    const date = new Date(weekStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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

  return (
    <div className="card">
      <h3 className="font-bold mb-4">Model Usage Over Time</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            stackOffset="expand"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#232323" strokeOpacity={0.1} />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeek}
              tick={{ fontSize: 11, fill: "#232323", fillOpacity: 0.5 }}
              tickLine={false}
              axisLine={{ stroke: "#232323", strokeOpacity: 0.1 }}
            />
            <YAxis
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fontSize: 11, fill: "#232323", fillOpacity: 0.5 }}
              tickLine={false}
              axisLine={{ stroke: "#232323", strokeOpacity: 0.1 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs">{formatModelName(value)}</span>
              )}
              wrapperStyle={{ fontSize: 10 }}
            />
            {models.map((model) => (
              <Area
                key={model}
                type="monotone"
                dataKey={model}
                stackId="1"
                stroke={getModelColor(model)}
                fill={getModelColor(model)}
                fillOpacity={0.8}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
