"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatNumber } from "@/lib/utils";

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  reasoningTokens: number;
}

interface TokenBreakdownChartProps {
  tokenUsage: TokenUsage[];
}

const COLORS = {
  input: "#D63384", // Pink
  output: "#0D6EFD", // Blue
  cacheRead: "#198754", // Green
  cacheWrite: "#CC9A06", // Yellow
  reasoning: "#6F42C1", // Purple
};

const LABELS: Record<string, string> = {
  input: "Input",
  output: "Output",
  cacheRead: "Cache Read",
  cacheWrite: "Cache Write",
  reasoning: "Reasoning",
};

export function TokenBreakdownChart({ tokenUsage }: TokenBreakdownChartProps) {
  if (!tokenUsage || tokenUsage.length === 0) {
    return null;
  }

  // Aggregate all token types
  const totals = tokenUsage.reduce(
    (acc, t) => ({
      input: acc.input + t.inputTokens,
      output: acc.output + t.outputTokens,
      cacheRead: acc.cacheRead + t.cacheReadTokens,
      cacheWrite: acc.cacheWrite + t.cacheCreationTokens,
      reasoning: acc.reasoning + t.reasoningTokens,
    }),
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 }
  );

  // Create chart data, filtering out zero values
  const chartData = [
    { name: "input", value: totals.input, label: LABELS.input },
    { name: "output", value: totals.output, label: LABELS.output },
    { name: "cacheRead", value: totals.cacheRead, label: LABELS.cacheRead },
    { name: "cacheWrite", value: totals.cacheWrite, label: LABELS.cacheWrite },
    { name: "reasoning", value: totals.reasoning, label: LABELS.reasoning },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: (typeof chartData)[0] }>;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const percentage = ((data.value / total) * 100).toFixed(1);
    return (
      <div className="bg-white border border-[#232323] rounded-lg p-3 shadow-[2px_2px_0_#232323]">
        <p className="font-bold text-sm mb-1">{data.label}</p>
        <p className="text-sm text-[#232323]/70">
          {formatNumber(data.value)} tokens ({percentage}%)
        </p>
      </div>
    );
  };

  return (
    <div className="card">
      <h3 className="font-bold mb-4">Token Breakdown</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                  stroke="#232323"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-xs">{value}</span>}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
