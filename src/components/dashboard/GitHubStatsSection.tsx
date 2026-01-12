"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/utils";
import {
  fetchGitHubStats,
  calculateEfficiencyRatios,
  type GitHubStats,
} from "@/lib/github";
import { DualHeatmap, GITHUB_COLORS } from "@/components/ui/charts";

interface DailyActivity {
  date: string;
  totalTokens: number;
}

interface GitHubStatsSectionProps {
  username: string;
  totalTokens: number;
  dailyActivity: DailyActivity[];
}

// Skeleton loader for the KPI cards
function StatsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card text-center">
            <div className="h-8 bg-[#232323]/10 rounded mb-2 mx-auto w-16" />
            <div className="h-4 bg-[#232323]/10 rounded mx-auto w-20" />
          </div>
        ))}
      </div>
      <div className="card mb-6">
        <div className="h-6 bg-[#232323]/10 rounded w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-[#232323]/10 rounded w-40 mb-2" />
              <div className="h-3 bg-[#232323]/10 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GitHubStatsSection({
  username,
  totalTokens,
  dailyActivity,
}: GitHubStatsSectionProps) {
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        const stats = await fetchGitHubStats(username);

        if (!mounted) return;

        if (stats) {
          setGithubStats(stats);
        } else {
          setError("Could not load GitHub stats");
        }
      } catch {
        if (mounted) {
          setError("Failed to load GitHub stats");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, [username]);

  if (loading) {
    return <StatsSkeleton />;
  }

  if (error || !githubStats) {
    return (
      <div className="card text-center py-8 text-[#232323]/60">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-[#232323]/30"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
        <p>No GitHub contributions found for @{username}</p>
        <p className="text-sm mt-2">
          Make sure the GitHub username matches your profile
        </p>
        <p className="text-xs mt-4 text-[#232323]/40">
          Tip: Enable &quot;Private contributions&quot; in your GitHub settings
          to include private repo activity
        </p>
      </div>
    );
  }

  const efficiency = calculateEfficiencyRatios(totalTokens, githubStats);

  // Calculate max values for progress bars
  const maxTokensPerMetric = Math.max(
    efficiency.tokensPerContribution,
    efficiency.tokensPerCommit,
    efficiency.tokensPerPR || 1
  );

  // Prepare data for dual heatmap
  const githubCalendarData = githubStats.contributionCalendar.map((day) => ({
    date: day.date,
    value: day.count,
  }));

  // Aggregate daily activity by date for AI usage
  const aiActivityMap = new Map<string, number>();
  dailyActivity.forEach((activity) => {
    const existing = aiActivityMap.get(activity.date) || 0;
    aiActivityMap.set(activity.date, existing + activity.totalTokens);
  });
  const aiCalendarData = Array.from(aiActivityMap.entries()).map(
    ([date, tokens]) => ({
      date,
      value: tokens,
    })
  );

  return (
    <>
      {/* GitHub Stats KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div
            className="text-3xl font-black"
            style={{ color: GITHUB_COLORS.contributions }}
          >
            {formatNumber(githubStats.totalContributions)}
          </div>
          <div className="text-sm text-[#232323]/60">Contributions</div>
          <div className="text-xs text-[#232323]/40">all time</div>
        </div>
        <div className="card text-center">
          <div
            className="text-3xl font-black"
            style={{ color: GITHUB_COLORS.commits }}
          >
            {formatNumber(githubStats.commits)}
          </div>
          <div className="text-sm text-[#232323]/60">Commits</div>
          <div className="text-xs text-[#232323]/40">all time</div>
        </div>
        <div className="card text-center">
          <div
            className="text-3xl font-black"
            style={{ color: GITHUB_COLORS.pullRequests }}
          >
            {formatNumber(githubStats.pullRequests)}
          </div>
          <div className="text-sm text-[#232323]/60">PRs</div>
          <div className="text-xs text-[#232323]/40">all time</div>
        </div>
        <div className="card text-center">
          <div
            className="text-3xl font-black"
            style={{ color: GITHUB_COLORS.reviews }}
          >
            {formatNumber(githubStats.reviews)}
          </div>
          <div className="text-sm text-[#232323]/60">Reviews</div>
          <div className="text-xs text-[#232323]/40">all time</div>
        </div>
      </div>

      {/* AI Efficiency Card */}
      <div className="card bg-gradient-to-br from-[#238636]/10 to-[#AAE7C0]/10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">AI Efficiency</h3>
          <span
            className={`tag ${
              efficiency.efficiencyLabel === "Efficient Shipper"
                ? "tag-green"
                : efficiency.efficiencyLabel === "Balanced Builder"
                ? "tag-blue"
                : "tag-pink"
            }`}
          >
            {efficiency.efficiencyLabel}
          </span>
        </div>
        <div className="space-y-4">
          {/* Tokens per Contribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#232323]/60">
                Tokens per Contribution
              </span>
              <span className="text-lg font-black text-[#238636]">
                {formatNumber(Math.round(efficiency.tokensPerContribution))}
              </span>
            </div>
            <div className="h-3 bg-[#232323]/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (efficiency.tokensPerContribution / maxTokensPerMetric) *
                      100,
                    100
                  )}%`,
                  backgroundColor: GITHUB_COLORS.contributions,
                }}
              />
            </div>
          </div>

          {/* Tokens per Commit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#232323]/60">
                Tokens per Commit
              </span>
              <span className="text-lg font-black text-[#3fb950]">
                {formatNumber(Math.round(efficiency.tokensPerCommit))}
              </span>
            </div>
            <div className="h-3 bg-[#232323]/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (efficiency.tokensPerCommit / maxTokensPerMetric) * 100,
                    100
                  )}%`,
                  backgroundColor: GITHUB_COLORS.commits,
                }}
              />
            </div>
          </div>

          {/* Tokens per PR */}
          {githubStats.pullRequests > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#232323]/60">Tokens per PR</span>
                <span className="text-lg font-black text-[#8250df]">
                  {formatNumber(Math.round(efficiency.tokensPerPR))}
                </span>
              </div>
              <div className="h-3 bg-[#232323]/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (efficiency.tokensPerPR / maxTokensPerMetric) * 100,
                      100
                    )}%`,
                    backgroundColor: GITHUB_COLORS.pullRequests,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dual Heatmap Comparison */}
      <DualHeatmap
        left={{
          data: githubCalendarData,
          label: "GitHub Contributions",
          color: GITHUB_COLORS.calendar,
        }}
        right={{
          data: aiCalendarData,
          label: "AI Tool Usage",
          color: "#AAE7C0", // vibetracking green
        }}
      />

      {/* Partial data notice */}
      {githubStats.partial && (
        <p className="text-xs text-[#232323]/40 text-center mt-4">
          Showing recent public activity. Full contribution data requires GitHub
          authentication.
        </p>
      )}
    </>
  );
}
