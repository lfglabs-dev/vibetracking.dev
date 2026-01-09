"use client";

import type { ReactNode } from "react";

interface ChartTooltipProps {
  title?: string;
  value?: string | ReactNode;
  subtitle?: string;
  children?: ReactNode;
}

export function ChartTooltip({ title, value, subtitle, children }: ChartTooltipProps) {
  return (
    <div className="bg-white border border-[#232323] rounded-lg p-3 shadow-[2px_2px_0_#232323]">
      {title && <p className="font-bold text-sm mb-1">{title}</p>}
      {value && <p className="text-sm text-[#232323]/70">{value}</p>}
      {subtitle && <p className="text-xs text-[#232323]/50 mt-1">{subtitle}</p>}
      {children}
    </div>
  );
}
