"use client";

import { PieChart, ChartCard, ChartTooltip } from "@/components/ui/charts";
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

const TOKEN_COLORS: Record<string, string> = {
  input: "#D63384", // Pink
  output: "#0D6EFD", // Blue
  cacheRead: "#198754", // Green
  cacheWrite: "#CC9A06", // Yellow
  reasoning: "#6F42C1", // Purple
};

const TOKEN_LABELS: Record<string, string> = {
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
    { key: "input", name: TOKEN_LABELS.input, value: totals.input, color: TOKEN_COLORS.input },
    { key: "output", name: TOKEN_LABELS.output, value: totals.output, color: TOKEN_COLORS.output },
    { key: "cacheRead", name: TOKEN_LABELS.cacheRead, value: totals.cacheRead, color: TOKEN_COLORS.cacheRead },
    { key: "cacheWrite", name: TOKEN_LABELS.cacheWrite, value: totals.cacheWrite, color: TOKEN_COLORS.cacheWrite },
    { key: "reasoning", name: TOKEN_LABELS.reasoning, value: totals.reasoning, color: TOKEN_COLORS.reasoning },
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
      <ChartTooltip
        title={data.name}
        value={`${formatNumber(data.value)} tokens (${percentage}%)`}
      />
    );
  };

  return (
    <ChartCard title="Token Breakdown" height={280}>
      <PieChart
        data={chartData}
        innerRadius={60}
        outerRadius={100}
        tooltipContent={<CustomTooltip />}
        showLegend
        strokeColor="#232323"
        strokeWidth={1}
        height={280}
      />
    </ChartCard>
  );
}
