"use client";

import type { ReactElement } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TOOLTIP_STYLE } from "./constants";

interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
  [key: string]: unknown;
}

interface PieChartProps {
  data: PieChartDataItem[];
  innerRadius?: number;
  outerRadius?: number;
  tooltipContent?: ReactElement;
  height?: number;
  paddingAngle?: number;
  showLegend?: boolean;
  legendFormatter?: (value: string) => React.ReactNode;
  strokeColor?: string;
  strokeWidth?: number;
}

export function PieChart({
  data,
  innerRadius = 60,
  outerRadius = 100,
  tooltipContent,
  height = 250,
  paddingAngle = 2,
  showLegend = false,
  legendFormatter,
  strokeColor,
  strokeWidth,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          ))}
        </Pie>
        <Tooltip
          content={tooltipContent}
          contentStyle={!tooltipContent ? TOOLTIP_STYLE : undefined}
        />
        {showLegend && (
          <Legend
            formatter={legendFormatter || ((value) => <span className="text-xs">{value}</span>)}
            wrapperStyle={{ fontSize: 11 }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
