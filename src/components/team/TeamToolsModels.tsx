"use client";

import { useMemo } from "react";
import { BarChart, PieChart, TOOL_COLORS, TOOL_LABELS, MODEL_COLORS, getColorFromString } from "@/components/ui/charts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { formatModelName } from "@/lib/formatModelName";
import type { DisplayUnit } from "@/components/dashboard/UnitToggle";

interface DailyActivityData {
  date: string;
  tool: string;
  totalTokens: number;
  cost: number;
}

interface TokenUsageData {
  date: string;
  model: string;
  tokens: number;
  cost: number;
}

interface TeamToolsModelsProps {
  dailyActivity: DailyActivityData[];
  tokenUsage: TokenUsageData[];
  unit: DisplayUnit;
}

export function TeamToolsModels({
  dailyActivity,
  tokenUsage,
  unit,
}: TeamToolsModelsProps) {
  // Aggregate tools
  const toolData = useMemo(() => {
    const toolTotals = new Map<string, { tokens: number; cost: number }>();

    dailyActivity.forEach((activity) => {
      const existing = toolTotals.get(activity.tool) || { tokens: 0, cost: 0 };
      toolTotals.set(activity.tool, {
        tokens: existing.tokens + activity.totalTokens,
        cost: existing.cost + activity.cost,
      });
    });

    return Array.from(toolTotals.entries())
      .map(([tool, data]) => ({
        name: TOOL_LABELS[tool as keyof typeof TOOL_LABELS] || tool,
        value: unit === "usd" ? data.cost : data.tokens,
        color: TOOL_COLORS[tool as keyof typeof TOOL_COLORS] || "#232323",
      }))
      .sort((a, b) => b.value - a.value);
  }, [dailyActivity, unit]);

  // Aggregate models
  const modelData = useMemo(() => {
    const modelTotals = new Map<string, { tokens: number; cost: number }>();

    tokenUsage.forEach((usage) => {
      const existing = modelTotals.get(usage.model) || { tokens: 0, cost: 0 };
      modelTotals.set(usage.model, {
        tokens: existing.tokens + usage.tokens,
        cost: existing.cost + usage.cost,
      });
    });

    return Array.from(modelTotals.entries())
      .map(([model, data], index) => ({
        name: formatModelName(model),
        value: unit === "usd" ? data.cost : data.tokens,
        color: MODEL_COLORS[index] || getColorFromString(model),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [tokenUsage, unit]);

  const valueFormatter = (value: number) => {
    if (unit === "usd") {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Tools Pie Chart */}
      <div className="card">
        <h3 className="font-bold mb-4">Usage by Tool</h3>
        {toolData.length > 0 ? (
          <PieChart
            data={toolData}
            innerRadius={60}
            outerRadius={100}
          />
        ) : (
          <div className="h-60 flex items-center justify-center text-[#232323]/40">
            No data yet
          </div>
        )}
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {toolData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
              <span className="text-[#232323]/40">{valueFormatter(item.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Models Bar Chart */}
      <div className="card">
        <h3 className="font-bold mb-4">Top Models</h3>
        {modelData.length > 0 ? (
          <BarChart
            data={modelData}
            layout="horizontal"
            xAxisFormatter={(value) =>
              unit === "usd" ? "$" + formatNumber(value) : formatNumber(value)
            }
            height={Math.max(200, modelData.length * 40)}
            labelWidth={140}
          />
        ) : (
          <div className="h-60 flex items-center justify-center text-[#232323]/40">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
