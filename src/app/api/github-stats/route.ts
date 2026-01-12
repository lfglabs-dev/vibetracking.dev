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

// GraphQL query for contribution data with date range
const GITHUB_CONTRIBUTIONS_QUERY = `
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  // Check server-side cache first
  const cached = statsCache.get(username);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
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

    // Step 3: Fetch contributions for each year in parallel
    const contributionPromises = yearRanges.map(async (range) => {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: GITHUB_CONTRIBUTIONS_QUERY,
          variables: { username, from: range.from, to: range.to },
        }),
      });

      if (!response.ok) {
        console.error(`Failed to fetch contributions for range ${range.from} - ${range.to}`);
        return null;
      }

      const result: GitHubContributionsResponse = await response.json();
      return result.data?.user?.contributionsCollection || null;
    });

    const allContributions = await Promise.all(contributionPromises);

    // Step 4: Aggregate all contributions
    let totalContributions = 0;
    let commits = 0;
    let pullRequests = 0;
    let issues = 0;
    let reviews = 0;
    const allCalendarDays: Array<{ date: string; count: number }> = [];

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

    const statsData: GitHubStatsResponse = {
      totalContributions,
      commits,
      pullRequests,
      issues,
      reviews,
      contributionCalendar,
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

    for (const event of events) {
      const date = event.created_at?.split("T")[0];
      if (date) {
        contributionsByDate.set(date, (contributionsByDate.get(date) || 0) + 1);
      }

      switch (event.type) {
        case "PushEvent":
          commits += event.payload?.commits?.length || 1;
          break;
        case "PullRequestEvent":
          if (event.payload?.action === "opened") {
            pullRequests += 1;
          }
          break;
        case "IssuesEvent":
          if (event.payload?.action === "opened") {
            issues += 1;
          }
          break;
        case "PullRequestReviewEvent":
          reviews += 1;
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
