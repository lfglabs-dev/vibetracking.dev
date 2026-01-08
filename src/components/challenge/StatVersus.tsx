"use client";

interface StatVersusProps {
  label: string;
  challengerValue: string;
  challengedValue: string;
  winner: "challenger" | "challenged" | "tie";
  index: number;
}

export function StatVersus({
  label,
  challengerValue,
  challengedValue,
  winner,
  index,
}: StatVersusProps) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-[#232323]/10 last:border-0"
      style={{
        animation: `fadeSlideIn 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Challenger Value */}
      <div
        className={`flex-1 text-left ${
          winner === "challenger"
            ? "text-[#198754] font-bold"
            : "text-[#232323]/70"
        }`}
      >
        <span className="text-lg">{challengerValue}</span>
        {winner === "challenger" && (
          <span className="ml-2 text-[#198754]">✓</span>
        )}
      </div>

      {/* Stat Label */}
      <div className="flex-1 text-center">
        <span className="text-sm font-medium text-[#232323]/60 uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Challenged Value */}
      <div
        className={`flex-1 text-right ${
          winner === "challenged"
            ? "text-[#198754] font-bold"
            : "text-[#232323]/70"
        }`}
      >
        {winner === "challenged" && (
          <span className="mr-2 text-[#198754]">✓</span>
        )}
        <span className="text-lg">{challengedValue}</span>
      </div>
    </div>
  );
}
