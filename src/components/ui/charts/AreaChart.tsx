"use client";

import type { ReactElement } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AXIS_STYLE, GRID_STYLE, TOOLTIP_STYLE } from "./constants";

interface AreaChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xAxisKey: string;
  color?: string;
  gradient?: boolean;
  gradientId?: string;
  tooltipContent?: ReactElement;
  xAxisFormatter?: (value: string) => string;
  yAxisFormatter?: (value: number) => string;
  height?: number;
  yAxisWidth?: number;
}

export function AreaChart({
  data,
  dataKey,
  xAxisKey,
  color = "#D63384",
  gradient = true,
  gradientId = "areaGradient",
  tooltipContent,
  xAxisFormatter,
  yAxisFormatter,
  height = 250,
  yAxisWidth = 50,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
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
          content={tooltipContent}
          contentStyle={!tooltipContent ? TOOLTIP_STYLE : undefined}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={gradient ? `url(#${gradientId})` : color}
          fillOpacity={gradient ? 1 : 0.3}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
