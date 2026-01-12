import { NextResponse } from "next/server";

// Server-side cache for GitHub stats (shared across all requests)
// This reduces rate limit consumption since all requests use the same PAT
const statsCache = new Map<string, { data: GitHubStatsResponse; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// GraphQL query for contribution data
const GITHUB_GRAPHQL_QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
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

interface GitHubGraphQLResponse {
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
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: GITHUB_GRAPHQL_QUERY,
        variables: { username },
      }),
    });

    // Check for rate limiting
    const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
    const rateLimitReset = response.headers.get("X-RateLimit-Reset");

    if (response.status === 403 && rateLimitRemaining === "0") {
      const resetTime = rateLimitReset
        ? new Date(parseInt(rateLimitReset) * 1000).toISOString()
        : "unknown";
      return NextResponse.json(
        { error: "Rate limited", resetAt: resetTime },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const result: GitHubGraphQLResponse = await response.json();

    if (result.errors) {
      const errorMessage = result.errors[0]?.message || "GraphQL error";
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

    const user = result.data?.user;
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const contributions = user.contributionsCollection;

    // Flatten contribution calendar into array of { date, count }
    const contributionCalendar = contributions.contributionCalendar.weeks.flatMap(
      (week) =>
        week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
        }))
    );

    const statsData: GitHubStatsResponse = {
      totalContributions: contributions.contributionCalendar.totalContributions,
      commits: contributions.totalCommitContributions,
      pullRequests: contributions.totalPullRequestContributions,
      issues: contributions.totalIssueContributions,
      reviews: contributions.totalPullRequestReviewContributions,
      contributionCalendar,
      fetchedAt: Date.now(),
    };

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
