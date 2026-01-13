// GitHub organization utilities for team management

export interface GitHubOrg {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  description: string | null;
}

export interface GitHubMember {
  id: number;
  login: string;
  avatar_url: string;
  type: string;
}

export interface GitHubOrgDetails {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  description: string | null;
  public_repos: number;
  public_members_url: string;
}

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Fetch organizations the user belongs to
 * Requires user's OAuth access token with read:org scope
 */
export async function fetchUserOrgs(
  accessToken: string
): Promise<GitHubOrg[]> {
  const response = await fetch(`${GITHUB_API_BASE}/user/orgs`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "vibetracking.dev",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch user orgs: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch organization details
 * Uses server-side GITHUB_PAT for higher rate limits
 */
export async function fetchOrgDetails(
  orgLogin: string
): Promise<GitHubOrgDetails | null> {
  const token = process.env.GITHUB_PAT;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "vibetracking.dev",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}/orgs/${orgLogin}`, {
    headers,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch org details: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch organization members (public members only without auth)
 * Uses server-side GITHUB_PAT for higher rate limits
 * Note: Without org admin access, only public members are returned
 */
export async function fetchOrgMembers(
  orgLogin: string,
  page = 1,
  perPage = 100
): Promise<GitHubMember[]> {
  const token = process.env.GITHUB_PAT;

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "vibetracking.dev",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${GITHUB_API_BASE}/orgs/${orgLogin}/members?page=${page}&per_page=${perPage}`,
    { headers }
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch org members: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch all organization members with pagination
 */
export async function fetchAllOrgMembers(
  orgLogin: string
): Promise<GitHubMember[]> {
  const allMembers: GitHubMember[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const members = await fetchOrgMembers(orgLogin, page, perPage);
    allMembers.push(...members);

    if (members.length < perPage) {
      break;
    }

    page++;

    // Safety limit to prevent infinite loops
    if (page > 50) {
      console.warn(`Reached pagination limit for org ${orgLogin}`);
      break;
    }
  }

  return allMembers;
}

/**
 * Check if a user is a member of an organization
 * Requires user's OAuth access token
 */
export async function checkOrgMembership(
  accessToken: string,
  orgLogin: string
): Promise<boolean> {
  const response = await fetch(
    `${GITHUB_API_BASE}/user/memberships/orgs/${orgLogin}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "vibetracking.dev",
      },
    }
  );

  return response.ok;
}

/**
 * Get user's role in an organization
 * Returns 'admin' if user is org owner/admin, 'member' otherwise
 */
export async function getOrgMembershipRole(
  accessToken: string,
  orgLogin: string
): Promise<"admin" | "member" | null> {
  const response = await fetch(
    `${GITHUB_API_BASE}/user/memberships/orgs/${orgLogin}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "vibetracking.dev",
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const membership = await response.json();
  return membership.role === "admin" ? "admin" : "member";
}

/**
 * Fetch organization members using user's access token
 * If the user is an org admin, this returns ALL members (including private)
 * If not admin, only public members are returned
 */
export async function fetchOrgMembersWithUserToken(
  accessToken: string,
  orgLogin: string,
  page = 1,
  perPage = 100
): Promise<GitHubMember[]> {
  const response = await fetch(
    `${GITHUB_API_BASE}/orgs/${orgLogin}/members?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "vibetracking.dev",
      },
    }
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch org members: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch all organization members using user's access token (with pagination)
 * If the user is an org admin, this returns ALL members (including private)
 */
export async function fetchAllOrgMembersWithUserToken(
  accessToken: string,
  orgLogin: string
): Promise<GitHubMember[]> {
  const allMembers: GitHubMember[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const members = await fetchOrgMembersWithUserToken(accessToken, orgLogin, page, perPage);
    allMembers.push(...members);

    if (members.length < perPage) {
      break;
    }

    page++;

    // Safety limit to prevent infinite loops
    if (page > 50) {
      console.warn(`Reached pagination limit for org ${orgLogin}`);
      break;
    }
  }

  return allMembers;
}
