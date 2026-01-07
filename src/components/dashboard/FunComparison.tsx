"use client";

import { calculateFunFactMetrics } from "@/lib/utils";

interface FunComparisonProps {
  totalTokens: number;
  estimatedApiSpend: number;
  activeDays: number;
}

export function FunComparison({
  totalTokens,
  estimatedApiSpend,
  activeDays,
}: FunComparisonProps) {
  const metrics = calculateFunFactMetrics(totalTokens, estimatedApiSpend, activeDays);

  // Format salary with proper K/M notation
  const formatSalary = (amount: number): string => {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
    return `$${Math.round(amount)}`;
  };

  // Format lines of code with K/M notation
  const formatLines = (lines: number): string => {
    if (lines >= 1_000_000) {
      return `${(lines / 1_000_000).toFixed(1)}M`;
    }
    if (lines >= 1_000) {
      return `${(lines / 1_000).toFixed(0)}K`;
    }
    return lines.toLocaleString();
  };

  // Format percentage
  const formatPercent = (percent: number): string => {
    if (percent >= 1000) {
      return `${(percent / 1000).toFixed(1)}K`;
    }
    return Math.round(percent).toLocaleString();
  };

  return (
    <div className="card bg-gradient-to-r from-[#FEA6CC]/20 to-[#AAE7C0]/20 border-2 border-dashed border-[#232323]/20">
      <div className="text-center py-4">
        <p className="text-sm text-[#232323]/60 mb-4">Fun facts</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Salary Saved */}
          <div className="text-center">
            <p className="text-2xl font-black text-[#D63384]">
              {formatSalary(metrics.salarySaved)}
            </p>
            <p className="text-sm text-[#232323]/60">
              AI made you save
            </p>
          </div>

          {/* Lines of Code */}
          <div className="text-center">
            <p className="text-2xl font-black text-[#198754]">
              {formatLines(metrics.linesOfCode)}
            </p>
            <p className="text-sm text-[#232323]/60">
              lines of code generated
            </p>
          </div>

          {/* Productivity Boost */}
          <div className="text-center">
            <p className="text-2xl font-black text-[#0D6EFD]">
              +{formatPercent(metrics.productivityBoostPercent)}%
            </p>
            <p className="text-sm text-[#232323]/60">
              more code written
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
