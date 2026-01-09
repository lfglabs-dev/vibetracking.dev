"use client";

import { useState, useRef, useEffect } from "react";
import { calculateFunFactMetrics } from "@/lib/utils";

interface FunComparisonProps {
  totalTokens: number;
  estimatedApiSpend: number;
  activeDays: number;
}

function InfoTooltip({ content }: { content: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      setPosition(spaceAbove < 120 ? "bottom" : "top");
    }
  }, [isVisible]);

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        className="ml-1 text-[#232323]/40 hover:text-[#232323]/60 transition-colors cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="More info"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {isVisible && (
        <span
          className={`absolute z-50 w-56 px-3 py-2 text-xs text-left text-[#232323]/80 bg-white border border-[#232323]/10 rounded-lg shadow-lg left-1/2 -translate-x-1/2 ${
            position === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
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
        <div className="flex items-center justify-center mb-4">
          <p className="text-sm text-[#232323]/60">Fun facts</p>
          <InfoTooltip content="Estimates based on ~0.1% of tokens being actual code output (due to caching), ~15 tokens per line, and $130K avg dev salary at ~50 LOC/day." />
        </div>
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
