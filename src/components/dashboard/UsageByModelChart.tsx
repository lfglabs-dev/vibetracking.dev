"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

// Color palette for models - matching KPI cards design system
const MODEL_COLORS = [
  "#D63384", // Pink (matches Total Tokens KPI)
  "#198754", // Green (matches Favorite Model KPI)
  "#0D6EFD", // Blue (matches Sessions KPI)
  "#CC9A06", // Yellow (matches Active Days KPI)
  "#6F42C1", // Purple
  "#FD7E14", // Orange
  "#20C997", // Teal
  "#DC3545", // Red
];

export function UsageByModelChart({ tokenUsage, unit }: UsageByModelChartProps) {
  if (!tokenUsage || tokenUsage.length === 0) {
    return null;
  }

  // Aggregate total tokens by model
  const modelTotals = new Map<string, { inputTokens: number; outputTokens: number }>();
  tokenUsage.forEach((item) => {
    const existing = modelTotals.get(item.model) || { inputTokens: 0, outputTokens: 0 };
    modelTotals.set(item.model, {
      inputTokens: existing.inputTokens + item.inputTokens,
      outputTokens: existing.outputTokens + item.outputTokens,
    });
  });

  // Create chart data sorted by total usage
  const chartData = [...modelTotals.entries()]
    .map(([model, tokens]) => {
      const totalTokens = tokens.inputTokens + tokens.outputTokens;
      const value = unit === "usd"
        ? estimateApiSpendUsd({ model, totalTokens })
        : totalTokens;
      return {
        model,
        modelName: formatModelName(model),
        value,
        totalTokens,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Limit to top 8 models

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-[#232323] rounded-lg p-3 shadow-[2px_2px_0_#232323]">
        <p className="font-bold text-sm mb-1">{data.modelName}</p>
        <p className="text-sm text-[#232323]/70">
          {unit === "usd"
            ? formatCurrency(data.value)
            : formatNumber(data.value) + " tokens"}
        </p>
      </div>
    );
  };

  const yAxisFormatter = (value: number) => {
    if (unit === "usd") {
      return "$" + formatNumber(value);
    }
    return formatNumber(value);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Usage by Model</h3>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#232323" strokeOpacity={0.1} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 11, fill: "#232323", fillOpacity: 0.5 }}
              tickLine={false}
              axisLine={{ stroke: "#232323", strokeOpacity: 0.1 }}
            />
            <YAxis
              type="category"
              dataKey="modelName"
              tick={{ fontSize: 11, fill: "#232323", fillOpacity: 0.7 }}
              tickLine={false}
              axisLine={{ stroke: "#232323", strokeOpacity: 0.1 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#232323", fillOpacity: 0.05 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
