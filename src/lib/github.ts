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

export interface GitHubStatsError {
  error: string;
  resetAt?: string; // ISO timestamp for rate limit reset
}

// Cache configuration
const CACHE_KEY_PREFIX = "vibetracking_github_stats_";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedStats {
  data: GitHubStats;
  cachedAt: number;
}

/**
 * Get cached GitHub stats from localStorage
 */
export function getCachedGitHubStats(username: string): GitHubStats | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + username);
    if (!cached) return null;

    const { data, cachedAt }: CachedStats = JSON.parse(cached);
    const age = Date.now() - cachedAt;

    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + username);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Save GitHub stats to localStorage cache
 */
function setCachedGitHubStats(username: string, data: GitHubStats): void {
  if (typeof window === "undefined") return;

  try {
    const cached: CachedStats = {
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY_PREFIX + username, JSON.stringify(cached));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Fetch GitHub stats for a user
 * Returns cached data if available and fresh, otherwise fetches from API
 */
export async function fetchGitHubStats(
  username: string
): Promise<GitHubStats | null> {
  // Check cache first
  const cached = getCachedGitHubStats(username);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `/api/github-stats?username=${encodeURIComponent(username)}`
    );

    if (!response.ok) {
      const errorData: GitHubStatsError = await response.json();

      // Handle rate limiting - return stale cache if available
      if (response.status === 429) {
        console.warn("GitHub API rate limited:", errorData.resetAt);
        return null;
      }

      // Handle not found
      if (response.status === 404) {
        return null;
      }

      console.error("GitHub API error:", errorData.error);
      return null;
    }

    const data: GitHubStats = await response.json();

    // Cache the result
    setCachedGitHubStats(username, data);

    return data;
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
  // These thresholds are somewhat arbitrary and can be tuned
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

/**
 * Clear cached GitHub stats for a user
 */
export function clearGitHubStatsCache(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY_PREFIX + username);
}

/**
 * Clear all cached GitHub stats
 */
export function clearAllGitHubStatsCache(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
