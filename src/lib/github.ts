// GitHub contribution data types and utilities

export interface GitHubStats {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  contributionCalendar: ContributionDay[];
  commitsByDay: ContributionDay[];
  prsByDay: ContributionDay[];
  reviewsByDay: ContributionDay[];
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

// Client-side cache TTL (15 minutes)
const CLIENT_CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_KEY_PREFIX = "vibetracking:github-stats:";

interface CachedStats {
  data: GitHubStats;
  cachedAt: number;
}

/**
 * Get cached GitHub stats from localStorage
 */
function getCachedStats(username: string): GitHubStats | null {
  if (typeof window === "undefined") return null;

  try {
    const key = CACHE_KEY_PREFIX + username.toLowerCase();
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedStats = JSON.parse(cached);
    const age = Date.now() - parsed.cachedAt;

    if (age < CLIENT_CACHE_TTL_MS) {
      return parsed.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

/**
 * Save GitHub stats to localStorage cache
 */
function setCachedStats(username: string, data: GitHubStats): void {
  if (typeof window === "undefined") return;

  try {
    const key = CACHE_KEY_PREFIX + username.toLowerCase();
    const cached: CachedStats = {
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Fetch GitHub stats for a user
 * - Client-side caching in localStorage (15-minute TTL)
 * - Server-side caching handled by the API route (5-minute TTL)
 */
export async function fetchGitHubStats(
  username: string
): Promise<GitHubStats | null> {
  // Check client-side cache first
  const cached = getCachedStats(username);
  if (cached) {
    return cached;
  }

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

    const stats: GitHubStats = await response.json();

    // Cache successful response
    setCachedStats(username, stats);

    return stats;
  } catch (error) {
    console.error("Failed to fetch GitHub stats:", error);
    return null;
  }
}
