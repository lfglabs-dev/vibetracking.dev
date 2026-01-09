"use client";

import type { Formatter } from "recharts/types/component/DefaultTooltipContent";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AXIS_STYLE, GRID_STYLE, TOOLTIP_STYLE } from "./constants";

export interface LineConfig {
  dataKey: string;
  color: string;
  label?: string;
}

interface LineChartProps {
  data: Array<Record<string, unknown>>;
  lines: LineConfig[];
  xAxisKey: string;
  xAxisFormatter?: (value: string) => string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: Formatter<number, string>;
  tooltipLabelFormatter?: (label: string) => string;
  height?: number;
  showLegend?: boolean;
  legendFormatter?: (value: string) => string;
  yAxisWidth?: number;
}

export function LineChart({
  data,
  lines,
  xAxisKey,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  height = 300,
  showLegend = true,
  legendFormatter,
  yAxisWidth = 60,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={xAxisFormatter}
          tick={AXIS_STYLE.tick}
          tickLine={AXIS_STYLE.tickLine}
          axisLine={AXIS_STYLE.axisLine}
        />
        <YAxis
          tickFormatter={yAxisFormatter}
          tick={AXIS_STYLE.tick}
          tickLine={AXIS_STYLE.tickLine}
          axisLine={AXIS_STYLE.axisLine}
          width={yAxisWidth}
        />
        <Tooltip
          formatter={tooltipFormatter}
          labelFormatter={tooltipLabelFormatter}
          contentStyle={TOOLTIP_STYLE}
        />
        {showLegend && (
          <Legend
            formatter={legendFormatter}
            wrapperStyle={{ fontSize: 12 }}
          />
        )}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
            name={line.label || line.dataKey}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
