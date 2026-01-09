"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  height?: number;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, rightSlot, height = 300, children }: ChartCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold">{title}</h3>
          {subtitle && <p className="text-xs text-[#232323]/50 mt-0.5">{subtitle}</p>}
        </div>
        {rightSlot}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
