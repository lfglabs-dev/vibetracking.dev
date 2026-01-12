"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";
import { fetchGitHubStats, type GitHubStats } from "@/lib/github";
import {
  ChartCard,
  GITHUB_COLORS,
  LineChart,
} from "@/components/ui/charts";
import {
  TimeframeSelector,
  filterByTimeframe,
  type Timeframe,
} from "./TimeframeSelector";
import { MODEL_RELEASES } from "@/lib/model-releases";

interface GitHubStatsSectionProps {
  username: string;
}

interface DailyTotalPoint {
  date: string;
  total: number;
}

// Skeleton loader for the charts
function StatsSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="card mb-6 last:mb-0">
          <div className="h-6 bg-[#232323]/10 rounded w-40 mb-4" />
          <div className="h-60 bg-[#232323]/10 rounded" />
        </div>
      ))}
    </div>
  );
}

function buildDateRange(start: string, end: string): string[] {
  const range: string[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return range;
  }

  const current = new Date(startDate);
  while (current <= endDate) {
    range.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return range;
}

function buildDailyTotals(stats: GitHubStats): DailyTotalPoint[] {
  const sortedDays = [...(stats.contributionCalendar || [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (sortedDays.length === 0) return [];

  const fullRange = buildDateRange(
    sortedDays[0].date,
    sortedDays[sortedDays.length - 1].date
  );

  const totalMap = new Map(sortedDays.map((day) => [day.date, day.count]));

  return fullRange.map((date) => ({
    date,
    total: totalMap.get(date) || 0,
  }));
}

function buildCumulativeSeries(data: DailyTotalPoint[]): Array<{ date: string; total: number }> {
  let running = 0;
  return data.map((point) => {
    running += point.total;
    return { date: point.date, total: running };
  });
}

type ModelFamily = "claude" | "gpt" | "gemini";

const MODEL_FAMILY_CONFIG: Record<ModelFamily, { label: string; color: string; match: (label: string) => boolean }> = {
  claude: {
    label: "Claude",
    color: "#FF6B2B",
    match: (label) => label.startsWith("Claude"),
  },
  gpt: {
    label: "GPT",
    color: "#10A37F",
    match: (label) => label.startsWith("GPT") || label === "o1",
  },
  gemini: {
    label: "Gemini",
    color: "#4285F4",
    match: (label) => label.startsWith("Gemini"),
  },
};

export function GitHubStatsSection({ username }: GitHubStatsSectionProps) {
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1y");
  const [enabledModels, setEnabledModels] = useState<Record<ModelFamily, boolean>>({
    claude: true,
    gpt: true,
    gemini: true,
  });

  const toggleModel = (model: ModelFamily) => {
    setEnabledModels((prev) => ({ ...prev, [model]: !prev[model] }));
  };

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

  const dailyTotals = useMemo(
    () => (githubStats ? buildDailyTotals(githubStats) : []),
    [githubStats]
  );

  const filteredTotals = useMemo(
    () => filterByTimeframe(dailyTotals, timeframe),
    [dailyTotals, timeframe]
  );

  const hasAnyTotals = dailyTotals.length > 0;
  const hasFilteredTotals = filteredTotals.length > 0;

  const dateRange = useMemo(() => {
    if (!hasFilteredTotals) return null;
    const start = filteredTotals[0]?.date;
    const end = filteredTotals[filteredTotals.length - 1]?.date;
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const spanDays = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    );
    return { start, end, spanDays };
  }, [filteredTotals, hasFilteredTotals]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;

    const range = dateRange;
    const showYear = range
      ? new Date(range.start).getFullYear() !== new Date(range.end).getFullYear()
      : false;

    if (range && range.spanDays > 365) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(showYear ? { year: "2-digit" } : {}),
    });
  };

  const referenceLines = useMemo(() => {
    if (!hasFilteredTotals || !dateRange) return [];
    // Filter by date range and enabled model families
    return MODEL_RELEASES.filter((release) => {
      if (release.date < dateRange.start || release.date > dateRange.end) return false;
      // Check if any enabled model family matches this release
      return (Object.entries(enabledModels) as [ModelFamily, boolean][]).some(
        ([family, enabled]) => enabled && MODEL_FAMILY_CONFIG[family].match(release.label)
      );
    }).map((release) => ({
      x: release.date,
      label: release.label,
      color: release.color,
    }));
  }, [dateRange, hasFilteredTotals, enabledModels]);

  const cumulativeSeries = useMemo(
    () => buildCumulativeSeries(filteredTotals),
    [filteredTotals]
  );

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

  if (!hasAnyTotals) {
    return (
      <div className="card text-center py-10 text-[#232323]/60">
        No GitHub activity yet.
      </div>
    );
  }

  if (!hasFilteredTotals) {
    const latestDate = dailyTotals[dailyTotals.length - 1]?.date;
    return (
      <div className="card text-center py-10 text-[#232323]/60">
        <p>No activity in the selected timeframe.</p>
        {latestDate && (
          <p className="text-xs text-[#232323]/40 mt-2">
            Latest activity in data: {formatDate(latestDate)}
          </p>
        )}
        {githubStats.partial && (
          <p className="text-xs text-[#232323]/40 mt-2">
            Showing public activity only. Add GITHUB_PAT for full history.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <ChartCard
        title="GitHub Activity"
        subtitle="Cumulative contributions over time"
        rightSlot={<TimeframeSelector value={timeframe} onChange={setTimeframe} />}
        height={280}
      >
        <LineChart
          data={cumulativeSeries}
          lines={[
            {
              dataKey: "total",
              color: GITHUB_COLORS.contributions,
              label: "Total contributions",
            },
          ]}
          xAxisKey="date"
          xAxisFormatter={formatDate}
          yAxisFormatter={(value) => formatNumber(value)}
          tooltipFormatter={(value) => {
            const numericValue = typeof value === "number" ? value : Number(value);
            return [formatNumber(Number.isFinite(numericValue) ? numericValue : 0), "Total contributions"];
          }}
          tooltipLabelFormatter={formatDate}
          showLegend={false}
          referenceLines={referenceLines}
          xAxisTickCount={8}
        />
      </ChartCard>

      {/* Model release filter */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <span className="text-xs text-[#232323]/60">Show releases:</span>
        {(Object.entries(MODEL_FAMILY_CONFIG) as [ModelFamily, typeof MODEL_FAMILY_CONFIG[ModelFamily]][]).map(
          ([key, config]) => (
            <label
              key={key}
              className="flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                checked={enabledModels[key]}
                onChange={() => toggleModel(key)}
                className="w-3.5 h-3.5 rounded border-[#232323]/20 accent-current"
                style={{ accentColor: config.color }}
              />
              <span
                className="font-medium"
                style={{ color: enabledModels[key] ? config.color : "#232323" }}
              >
                {config.label}
              </span>
            </label>
          )
        )}
      </div>

      {githubStats.partial && (
        <p className="text-xs text-[#232323]/40 text-center mt-3">
          Showing public activity only. Add GITHUB_PAT for full history.
        </p>
      )}
    </>
  );
}
