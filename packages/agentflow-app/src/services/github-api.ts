/**
 * GitHub API Service
 *
 * Provides typed access to the GitHub REST API v3.
 * The token is read from the VITE_GITHUB_TOKEN environment variable
 * (set in .env – never committed to version control).
 */

const GITHUB_API_BASE = 'https://api.github.com';
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function headers(): HeadersInit {
  const h: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (TOKEN) {
    (h as Record<string, string>)['Authorization'] = `Bearer ${TOKEN}`;
  }
  return h;
}

async function ghFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status} for ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  language: string | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  user: { login: string; avatar_url: string };
  labels: { name: string; color: string }[];
  created_at: string;
  updated_at: string;
  body: string | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  html_url: string;
  user: { login: string; avatar_url: string };
  head: { ref: string; sha: string };
  base: { ref: string };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
}

export interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
  author: { login: string; avatar_url: string } | null;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/** Fetch the authenticated user's profile. */
export async function getAuthenticatedUser(): Promise<GitHubUser> {
  return ghFetch<GitHubUser>('/user');
}

/**
 * List repositories for the authenticated user.
 * @param perPage  Number of repos per page (max 100, default 30)
 * @param page     Page number (1-based)
 */
export async function listUserRepos(
  perPage = 30,
  page = 1,
): Promise<GitHubRepo[]> {
  return ghFetch<GitHubRepo[]>(
    `/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
  );
}

/**
 * List repositories for a specific organisation or user.
 * @param owner    GitHub username or organisation name
 */
export async function listRepos(
  owner: string,
  perPage = 30,
  page = 1,
): Promise<GitHubRepo[]> {
  return ghFetch<GitHubRepo[]>(
    `/users/${owner}/repos?per_page=${perPage}&page=${page}&sort=updated`,
  );
}

/**
 * Fetch a single repository.
 */
export async function getRepo(owner: string, repo: string): Promise<GitHubRepo> {
  return ghFetch<GitHubRepo>(`/repos/${owner}/${repo}`);
}

/**
 * List open issues for a repository (excludes pull requests).
 */
export async function listIssues(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
  perPage = 30,
): Promise<GitHubIssue[]> {
  const issues = await ghFetch<(GitHubIssue & { pull_request?: unknown })[]>(
    `/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}`,
  );
  // GitHub returns PRs mixed in with issues; filter them out
  return issues.filter((i) => !i.pull_request);
}

/**
 * List pull requests for a repository.
 */
export async function listPullRequests(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
  perPage = 30,
): Promise<GitHubPullRequest[]> {
  return ghFetch<GitHubPullRequest[]>(
    `/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}`,
  );
}

/**
 * Get the status / merge state of a single pull request.
 */
export async function getPullRequest(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  return ghFetch<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls/${prNumber}`);
}

/**
 * List commits on the default (or specified) branch.
 */
export async function listCommits(
  owner: string,
  repo: string,
  branch?: string,
  perPage = 30,
): Promise<GitHubCommit[]> {
  const branchParam = branch ? `&sha=${branch}` : '';
  return ghFetch<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits?per_page=${perPage}${branchParam}`,
  );
}

/**
 * Search repositories by keyword.
 */
export async function searchRepos(
  query: string,
  perPage = 10,
): Promise<{ total_count: number; items: GitHubRepo[] }> {
  return ghFetch<{ total_count: number; items: GitHubRepo[] }>(
    `/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}`,
  );
}
