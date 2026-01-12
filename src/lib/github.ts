// GitHub contribution data types and utilities

export interface GitHubStats {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  contributionCalendar: ContributionDay[];
  fetchedAt: number;
  partial?: boolean; // True if data came from REST API fallback (limited data)
}

export interface ContributionDay {
  date: string;
  count: number;
}

interface GitHubStatsError {
  error: string;
  resetAt?: string;
}

/**
 * Fetch GitHub stats for a user
 * Server-side caching is handled by the API route (5-minute TTL)
 */
export async function fetchGitHubStats(
  username: string
): Promise<GitHubStats | null> {
  try {
    const response = await fetch(
      `/api/github-stats?username=${encodeURIComponent(username)}`
    );

    if (!response.ok) {
      const errorData: GitHubStatsError = await response.json();

      if (response.status === 429) {
        console.warn("GitHub API rate limited:", errorData.resetAt);
      } else if (response.status !== 404) {
        console.error("GitHub API error:", errorData.error);
      }

      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch GitHub stats:", error);
    return null;
  }
}

/**
 * Calculate efficiency ratios between AI tokens and GitHub contributions
 */
export function calculateEfficiencyRatios(
  totalTokens: number,
  githubStats: GitHubStats
): {
  tokensPerContribution: number;
  tokensPerCommit: number;
  tokensPerPR: number;
  efficiencyLabel: "Efficient Shipper" | "Balanced Builder" | "Heavy Viber";
} {
  const tokensPerContribution =
    githubStats.totalContributions > 0
      ? totalTokens / githubStats.totalContributions
      : 0;

  const tokensPerCommit =
    githubStats.commits > 0 ? totalTokens / githubStats.commits : 0;

  const tokensPerPR =
    githubStats.pullRequests > 0 ? totalTokens / githubStats.pullRequests : 0;

  // Determine efficiency label based on tokens per contribution
  let efficiencyLabel: "Efficient Shipper" | "Balanced Builder" | "Heavy Viber";
  if (tokensPerContribution < 500) {
    efficiencyLabel = "Efficient Shipper";
  } else if (tokensPerContribution < 2000) {
    efficiencyLabel = "Balanced Builder";
  } else {
    efficiencyLabel = "Heavy Viber";
  }

  return {
    tokensPerContribution,
    tokensPerCommit,
    tokensPerPR,
    efficiencyLabel,
  };
}
