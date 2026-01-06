"use client";

interface FunComparisonProps {
  totalTokens: number;
  totalSessions: number;
  longestSessionMs: number;
}

export function FunComparison({
  totalTokens,
  totalSessions,
  longestSessionMs,
}: FunComparisonProps) {
  const comparisons: { text: string; condition: boolean }[] = [];

  // Token comparisons
  const novels = Math.round(totalTokens / 75000);
  if (novels >= 1) {
    comparisons.push({
      text: `${novels.toLocaleString()} novel${novels > 1 ? "s" : ""} worth of code`,
      condition: true,
    });
  }

  const tweets = Math.round(totalTokens / 50);
  if (tweets >= 1000) {
    comparisons.push({
      text: `${(tweets / 1000).toFixed(1)}K tweets worth of prompts`,
      condition: true,
    });
  }

  // Session comparisons (duration in ms to hours)
  const totalHours = Math.round(longestSessionMs / 3600000);
  if (totalHours >= 1) {
    const inceptionRuntimes = Math.round(totalHours / 2.5);
    if (inceptionRuntimes >= 1) {
      comparisons.push({
        text: `${inceptionRuntimes}x longer than Inception`,
        condition: true,
      });
    }
  }

  const marathons = Math.round(totalHours / 4);
  if (marathons >= 1) {
    comparisons.push({
      text: `${marathons} marathon${marathons > 1 ? "s" : ""} of coding`,
      condition: true,
    });
  }

  // Session count comparisons
  if (totalSessions >= 100) {
    comparisons.push({
      text: `More sessions than a therapist sees in a month`,
      condition: true,
    });
  }

  if (comparisons.length === 0) {
    return null;
  }

  // Pick a random comparison
  const comparison = comparisons[Math.floor(Math.random() * comparisons.length)];

  return (
    <div className="card bg-gradient-to-r from-[#FEA6CC]/20 to-[#AAE7C0]/20 border-2 border-dashed border-[#232323]/20">
      <div className="text-center py-4">
        <p className="text-sm text-[#232323]/60 mb-2">Fun fact</p>
        <p className="text-lg font-bold">
          Thats{" "}
          <span className="text-[#FEA6CC]">{comparison.text}</span>!
        </p>
      </div>
    </div>
  );
}
