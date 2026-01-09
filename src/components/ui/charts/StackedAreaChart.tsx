"use client";

import type { ReactElement } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AXIS_STYLE, GRID_STYLE } from "./constants";

export interface AreaConfig {
  dataKey: string;
  color: string;
  label?: string;
}

interface StackedAreaChartProps {
  data: Array<Record<string, unknown>>;
  areas: AreaConfig[];
  xAxisKey: string;
  normalized?: boolean;
  tooltipContent?: ReactElement;
  xAxisFormatter?: (value: string) => string;
  yAxisFormatter?: (value: number) => string;
  height?: number;
  showLegend?: boolean;
  legendFormatter?: (value: string) => React.ReactNode;
}

export function StackedAreaChart({
  data,
  areas,
  xAxisKey,
  normalized = false,
  tooltipContent,
  xAxisFormatter,
  yAxisFormatter,
  height = 300,
  showLegend = false,
  legendFormatter,
}: StackedAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        stackOffset={normalized ? "expand" : "none"}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid {...GRID_STYLE} />
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={xAxisFormatter}
          tick={AXIS_STYLE.tick}
          tickLine={AXIS_STYLE.tickLine}
          axisLine={AXIS_STYLE.axisLine}
        />
        <YAxis
          tickFormatter={yAxisFormatter || (normalized ? (v) => `${Math.round(v * 100)}%` : undefined)}
          tick={AXIS_STYLE.tick}
          tickLine={AXIS_STYLE.tickLine}
          axisLine={AXIS_STYLE.axisLine}
          width={50}
        />
        <Tooltip content={tooltipContent} />
        {showLegend && (
          <Legend
            formatter={legendFormatter || ((value) => <span className="text-xs">{value}</span>)}
            wrapperStyle={{ fontSize: 10 }}
          />
        )}
        {areas.map((area) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            stackId="1"
            stroke={area.color}
            fill={area.color}
            fillOpacity={0.8}
            name={area.label || area.dataKey}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
