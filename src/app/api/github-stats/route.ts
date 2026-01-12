import { NextResponse } from "next/server";

// Server-side cache for GitHub stats (shared across all requests)
// This reduces rate limit consumption since all requests use the same PAT
const statsCache = new Map<string, { data: GitHubStatsResponse; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// GraphQL query to get user creation date
const GITHUB_USER_QUERY = `
  query($username: String!) {
    user(login: $username) {
      createdAt
    }
  }
`;

// Core GraphQL query - only contribution calendar and totals (no repo-level access needed)
// This should always work even when org policies block access to specific repositories
const GITHUB_CONTRIBUTIONS_CORE_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

// Detailed GraphQL query - includes per-day breakdowns (requires repo-level access)
// This may fail for some orgs with restrictive token policies, but we can fall back to core data
const GITHUB_CONTRIBUTIONS_DETAILED_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository(maxRepositories: 100) {
          contributions(first: 100) {
            nodes {
              occurredAt
              commitCount
            }
          }
        }
        pullRequestContributions(first: 100) {
          nodes {
            occurredAt
          }
        }
        pullRequestReviewContributions(first: 100) {
          nodes {
            occurredAt
          }
        }
      }
    }
  }
`;

interface GitHubUserResponse {
  data?: {
    user?: {
      createdAt: string;
    };
  };
  errors?: Array<{ message: string }>;
}

interface GitHubContributionsResponse {
  data?: {
    user?: {
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        totalPullRequestReviewContributions: number;
        commitContributionsByRepository: Array<{
          contributions: {
            nodes: Array<{
              occurredAt: string;
              commitCount: number;
            }>;
          };
        }>;
        pullRequestContributions: {
          nodes: Array<{
            occurredAt: string;
          }>;
        };
        pullRequestReviewContributions: {
          nodes: Array<{
            occurredAt: string;
          }>;
        };
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: Array<{
              contributionCount: number;
              date: string;
            }>;
          }>;
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

interface GitHubStatsResponse {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  contributionCalendar: Array<{ date: string; count: number }>;
  commitsByDay: Array<{ date: string; count: number }>;
  prsByDay: Array<{ date: string; count: number }>;
  reviewsByDay: Array<{ date: string; count: number }>;
  fetchedAt: number;
  partial?: boolean;
}

// Helper function to generate year ranges from a start date to now
function getYearRanges(createdAt: string): Array<{ from: string; to: string }> {
  const startDate = new Date(createdAt);
  const now = new Date();
  const ranges: Array<{ from: string; to: string }> = [];

  // Start from the user's account creation date
  let currentStart = new Date(startDate);

  while (currentStart < now) {
    // Each range is 1 year (GitHub's max for contributionsCollection)
    const rangeEnd = new Date(currentStart);
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);

    // Don't go past today
    const effectiveEnd = rangeEnd > now ? now : rangeEnd;

    ranges.push({
      from: currentStart.toISOString(),
      to: effectiveEnd.toISOString(),
    });

    // Move to next year
    currentStart = rangeEnd;
  }

  return ranges;
}

function toDateKey(dateTime?: string): string | null {
  if (!dateTime) return null;
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const noCache = searchParams.get("nocache") === "1";

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  // Check server-side cache first (unless nocache is set for debugging)
  if (!noCache) {
    const cached = statsCache.get(username);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }
  }

  // Use server-side GitHub PAT for authenticated requests (5000 req/hour)
  const githubToken = process.env.GITHUB_PAT;

  if (!githubToken) {
    console.warn("GITHUB_PAT not configured - falling back to REST API (60 req/hour limit)");
    return await fetchContributionsViaREST(username);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "User-Agent": "vibetracking.dev",
    "Authorization": `Bearer ${githubToken}`,
  };

  try {
    // Step 1: Get user creation date
    const userResponse = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: GITHUB_USER_QUERY,
        variables: { username },
      }),
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${userResponse.status}` },
        { status: userResponse.status }
      );
    }

    const userResult: GitHubUserResponse = await userResponse.json();

    if (userResult.errors) {
      const errorMessage = userResult.errors[0]?.message || "GraphQL error";
      if (errorMessage.includes("Could not resolve to a User")) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const user = userResult.data?.user;
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Step 2: Calculate year ranges from account creation to now
    const yearRanges = getYearRanges(user.createdAt);

    // Step 3: Fetch contributions for each year in parallel using TWO queries:
    // - Core query: calendar and totals (always works)
    // - Detailed query: per-day breakdowns (may fail for some orgs with restrictive token policies)
    const contributionPromises = yearRanges.map(async (range) => {
      const rangeLabel = `${range.from.split('T')[0]} - ${range.to.split('T')[0]}`;

      // First, fetch core data (calendar + totals) - this should always work
      const coreResponse = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: GITHUB_CONTRIBUTIONS_CORE_QUERY,
          variables: { username, from: range.from, to: range.to },
        }),
      });

      if (!coreResponse.ok) {
        console.error(`[GitHub Stats] Failed to fetch core contributions for range ${rangeLabel}: HTTP ${coreResponse.status}`);
        return null;
      }

      const coreResult: GitHubContributionsResponse = await coreResponse.json();

      if (coreResult.errors) {
        console.warn(`[GitHub Stats] Core query errors for ${rangeLabel}:`, coreResult.errors.map(e => e.message).join('; '));
      }

      const coreCollection = coreResult.data?.user?.contributionsCollection;
      if (!coreCollection) {
        return null;
      }

      // Now try to fetch detailed data (per-day breakdowns) - this may fail for some orgs
      try {
        const detailedResponse = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: GITHUB_CONTRIBUTIONS_DETAILED_QUERY,
            variables: { username, from: range.from, to: range.to },
          }),
        });

        if (detailedResponse.ok) {
          const detailedResult: GitHubContributionsResponse = await detailedResponse.json();
          const detailedCollection = detailedResult.data?.user?.contributionsCollection;

          if (detailedCollection && !detailedResult.errors) {
            // Merge detailed data into core collection
            return {
              ...coreCollection,
              commitContributionsByRepository: detailedCollection.commitContributionsByRepository,
              pullRequestContributions: detailedCollection.pullRequestContributions,
              pullRequestReviewContributions: detailedCollection.pullRequestReviewContributions,
            };
          }
          // Detailed query may fail for orgs with restrictive token policies - fall through to return core data
        }
      } catch {
        // Detailed query failed - fall through to return core data
      }

      // Return core data without detailed breakdowns
      return coreCollection;
    });

    const allContributions = await Promise.all(contributionPromises);

    // Step 4: Aggregate all contributions
    let totalContributions = 0;
    let commits = 0;
    let pullRequests = 0;
    let issues = 0;
    let reviews = 0;
    const allCalendarDays: Array<{ date: string; count: number }> = [];
    const commitsByDayMap = new Map<string, number>();
    const prsByDayMap = new Map<string, number>();
    const reviewsByDayMap = new Map<string, number>();

    for (const contributions of allContributions) {
      if (!contributions) continue;

      totalContributions += contributions.contributionCalendar.totalContributions;
      commits += contributions.totalCommitContributions;
      pullRequests += contributions.totalPullRequestContributions;
      issues += contributions.totalIssueContributions;
      reviews += contributions.totalPullRequestReviewContributions;

      // Flatten calendar days
      for (const week of contributions.contributionCalendar.weeks) {
        for (const day of week.contributionDays) {
          allCalendarDays.push({
            date: day.date,
            count: day.contributionCount,
          });
        }
      }

      const rangeCommitsByDay = new Map<string, number>();
      for (const repo of contributions.commitContributionsByRepository || []) {
        for (const node of repo.contributions.nodes || []) {
          const dateKey = toDateKey(node.occurredAt);
          if (!dateKey) continue;
          const existing = rangeCommitsByDay.get(dateKey) || 0;
          rangeCommitsByDay.set(dateKey, existing + (node.commitCount || 0));
        }
      }

      for (const [date, count] of rangeCommitsByDay.entries()) {
        const existing = commitsByDayMap.get(date);
        commitsByDayMap.set(date, existing === undefined ? count : Math.max(existing, count));
      }

      const rangePrsByDay = new Map<string, number>();
      for (const node of contributions.pullRequestContributions?.nodes || []) {
        const dateKey = toDateKey(node.occurredAt);
        if (!dateKey) continue;
        rangePrsByDay.set(dateKey, (rangePrsByDay.get(dateKey) || 0) + 1);
      }

      for (const [date, count] of rangePrsByDay.entries()) {
        const existing = prsByDayMap.get(date);
        prsByDayMap.set(date, existing === undefined ? count : Math.max(existing, count));
      }

      const rangeReviewsByDay = new Map<string, number>();
      for (const node of contributions.pullRequestReviewContributions?.nodes || []) {
        const dateKey = toDateKey(node.occurredAt);
        if (!dateKey) continue;
        rangeReviewsByDay.set(dateKey, (rangeReviewsByDay.get(dateKey) || 0) + 1);
      }

      for (const [date, count] of rangeReviewsByDay.entries()) {
        const existing = reviewsByDayMap.get(date);
        reviewsByDayMap.set(date, existing === undefined ? count : Math.max(existing, count));
      }
    }

    // Remove duplicate days (overlapping year boundaries) and sort by date
    const calendarMap = new Map<string, number>();
    for (const day of allCalendarDays) {
      // Keep the max value for any duplicate dates
      const existing = calendarMap.get(day.date) || 0;
      calendarMap.set(day.date, Math.max(existing, day.count));
    }

    const contributionCalendar = Array.from(calendarMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const commitsByDay = Array.from(commitsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const prsByDay = Array.from(prsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const reviewsByDay = Array.from(reviewsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const statsData: GitHubStatsResponse = {
      totalContributions,
      commits,
      pullRequests,
      issues,
      reviews,
      contributionCalendar,
      commitsByDay,
      prsByDay,
      reviewsByDay,
      fetchedAt: Date.now(),
    };

    // Check for rate limiting on the last request
    const rateLimitRemaining = userResponse.headers.get("X-RateLimit-Remaining");
    if (rateLimitRemaining && parseInt(rateLimitRemaining) < 100) {
      console.warn(`GitHub API rate limit low: ${rateLimitRemaining} remaining`);
    }

    // Cache the result server-side
    statsCache.set(username, { data: statsData, cachedAt: Date.now() });

    return NextResponse.json(statsData);
  } catch (error) {
    console.error("GitHub API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}

// Fallback: Fetch contribution data via REST API (works without PAT but limited)
async function fetchContributionsViaREST(username: string) {
  try {
    // Use the events API to get recent activity
    const eventsResponse = await fetch(
      `https://api.github.com/users/${username}/events/public?per_page=100`,
      {
        headers: {
          "User-Agent": "vibetracking.dev",
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (eventsResponse.status === 404) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!eventsResponse.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${eventsResponse.status}` },
        { status: eventsResponse.status }
      );
    }

    const events = await eventsResponse.json();

    // Count contributions from events
    let commits = 0;
    let pullRequests = 0;
    let issues = 0;
    let reviews = 0;

    const contributionsByDate = new Map<string, number>();
    const commitsByDate = new Map<string, number>();
    const prsByDate = new Map<string, number>();
    const reviewsByDate = new Map<string, number>();

    for (const event of events) {
      const date = event.created_at?.split("T")[0];
      if (date) {
        contributionsByDate.set(date, (contributionsByDate.get(date) || 0) + 1);
      }

      switch (event.type) {
        case "PushEvent":
          {
            const commitCount = event.payload?.commits?.length || 1;
            commits += commitCount;
            if (date) {
              commitsByDate.set(date, (commitsByDate.get(date) || 0) + commitCount);
            }
          }
          break;
        case "PullRequestEvent":
          if (event.payload?.action === "opened") {
            pullRequests += 1;
            if (date) {
              prsByDate.set(date, (prsByDate.get(date) || 0) + 1);
            }
          }
          break;
        case "IssuesEvent":
          if (event.payload?.action === "opened") {
            issues += 1;
          }
          break;
        case "PullRequestReviewEvent":
          reviews += 1;
          if (date) {
            reviewsByDate.set(date, (reviewsByDate.get(date) || 0) + 1);
          }
          break;
      }
    }

    // Generate calendar for last 365 days
    const today = new Date();
    const contributionCalendar = [];
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      contributionCalendar.push({
        date: dateStr,
        count: contributionsByDate.get(dateStr) || 0,
      });
    }

    const totalContributions = commits + pullRequests + issues + reviews;

    const statsData: GitHubStatsResponse = {
      totalContributions,
      commits,
      pullRequests,
      issues,
      reviews,
      contributionCalendar,
      commitsByDay: Array.from(commitsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      prsByDay: Array.from(prsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      reviewsByDay: Array.from(reviewsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      fetchedAt: Date.now(),
      partial: true, // Indicates this is partial data from REST API
    };

    // Cache even the partial results
    statsCache.set(username, { data: statsData, cachedAt: Date.now() });

    return NextResponse.json(statsData);
  } catch (error) {
    console.error("GitHub REST API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}
