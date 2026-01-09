"use client";

import type { ReactElement } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AXIS_STYLE, GRID_STYLE, MODEL_COLORS } from "./constants";

interface BarChartDataItem {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

interface BarChartProps {
  data: BarChartDataItem[];
  layout?: "horizontal" | "vertical";
  colors?: string[];
  tooltipContent?: ReactElement;
  height?: number;
  xAxisFormatter?: (value: number) => string;
  barRadius?: [number, number, number, number];
  nameKey?: string;
  valueKey?: string;
  labelWidth?: number;
}

export function BarChart({
  data,
  layout = "vertical",
  colors = MODEL_COLORS,
  tooltipContent,
  height = 300,
  xAxisFormatter,
  barRadius = [0, 4, 4, 0],
  nameKey = "name",
  valueKey = "value",
  labelWidth = 100,
}: BarChartProps) {
  const isVertical = layout === "vertical";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          {...GRID_STYLE}
          horizontal={!isVertical}
          vertical={isVertical}
        />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tickFormatter={xAxisFormatter}
              tick={AXIS_STYLE.tick}
              tickLine={AXIS_STYLE.tickLine}
              axisLine={AXIS_STYLE.axisLine}
            />
            <YAxis
              type="category"
              dataKey={nameKey}
              tick={{ ...AXIS_STYLE.tick, fillOpacity: 0.7 }}
              tickLine={AXIS_STYLE.tickLine}
              axisLine={AXIS_STYLE.axisLine}
              width={labelWidth}
            />
          </>
        ) : (
          <>
            <XAxis
              type="category"
              dataKey={nameKey}
              tick={AXIS_STYLE.tick}
              tickLine={AXIS_STYLE.tickLine}
              axisLine={AXIS_STYLE.axisLine}
            />
            <YAxis
              type="number"
              tickFormatter={xAxisFormatter}
              tick={AXIS_STYLE.tick}
              tickLine={AXIS_STYLE.tickLine}
              axisLine={AXIS_STYLE.axisLine}
            />
          </>
        )}
        <Tooltip
          content={tooltipContent}
          cursor={{ fill: "#232323", fillOpacity: 0.05 }}
        />
        <Bar dataKey={valueKey} radius={barRadius}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
