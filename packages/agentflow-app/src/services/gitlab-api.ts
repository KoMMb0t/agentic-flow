/**
 * GitLab API Service
 *
 * Provides typed access to the GitLab REST API v4.
 * The token is read from the VITE_GITLAB_TOKEN environment variable
 * (set in .env – never committed to version control).
 *
 * Defaults to gitlab.com; override VITE_GITLAB_URL for self-hosted instances.
 */

const GITLAB_BASE_URL =
  (import.meta.env.VITE_GITLAB_URL as string | undefined) ?? 'https://gitlab.com';
const GITLAB_API_BASE = `${GITLAB_BASE_URL}/api/v4`;
const TOKEN = import.meta.env.VITE_GITLAB_TOKEN as string | undefined;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function headers(): HeadersInit {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (TOKEN) {
    h['PRIVATE-TOKEN'] = TOKEN;
  }
  return h;
}

async function glFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${GITLAB_API_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitLab API error ${res.status} for ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path_with_namespace: string;
  description: string | null;
  web_url: string;
  visibility: 'private' | 'internal' | 'public';
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  last_activity_at: string;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  state: 'opened' | 'closed' | 'locked' | 'merged';
  web_url: string;
  author: { username: string; avatar_url: string };
  source_branch: string;
  target_branch: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
  has_conflicts: boolean;
}

export interface GitLabPipeline {
  id: number;
  iid: number;
  status:
    | 'created'
    | 'waiting_for_resource'
    | 'preparing'
    | 'pending'
    | 'running'
    | 'success'
    | 'failed'
    | 'canceled'
    | 'skipped'
    | 'manual'
    | 'scheduled';
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
  duration: number | null;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  web_url: string;
}

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  email: string | null;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/** Fetch the authenticated user's profile. */
export async function getAuthenticatedUser(): Promise<GitLabUser> {
  return glFetch<GitLabUser>('/user');
}

/**
 * List projects accessible to the authenticated user.
 * @param membership  If true, only return projects the user is a member of.
 */
export async function listProjects(
  membership = true,
  perPage = 20,
  page = 1,
): Promise<GitLabProject[]> {
  return glFetch<GitLabProject[]>(
    `/projects?membership=${membership}&per_page=${perPage}&page=${page}&order_by=last_activity_at`,
  );
}

/**
 * Fetch a single project by its numeric ID or URL-encoded path.
 */
export async function getProject(
  projectId: number | string,
): Promise<GitLabProject> {
  const id = encodeURIComponent(String(projectId));
  return glFetch<GitLabProject>(`/projects/${id}`);
}

/**
 * List merge requests for a project.
 */
export async function listMergeRequests(
  projectId: number | string,
  state: 'opened' | 'closed' | 'locked' | 'merged' | 'all' = 'opened',
  perPage = 20,
): Promise<GitLabMergeRequest[]> {
  const id = encodeURIComponent(String(projectId));
  return glFetch<GitLabMergeRequest[]>(
    `/projects/${id}/merge_requests?state=${state}&per_page=${perPage}`,
  );
}

/**
 * Get a single merge request.
 */
export async function getMergeRequest(
  projectId: number | string,
  mrIid: number,
): Promise<GitLabMergeRequest> {
  const id = encodeURIComponent(String(projectId));
  return glFetch<GitLabMergeRequest>(`/projects/${id}/merge_requests/${mrIid}`);
}

/**
 * List pipelines for a project.
 */
export async function listPipelines(
  projectId: number | string,
  perPage = 20,
): Promise<GitLabPipeline[]> {
  const id = encodeURIComponent(String(projectId));
  return glFetch<GitLabPipeline[]>(
    `/projects/${id}/pipelines?per_page=${perPage}`,
  );
}

/**
 * Get a single pipeline.
 */
export async function getPipeline(
  projectId: number | string,
  pipelineId: number,
): Promise<GitLabPipeline> {
  const id = encodeURIComponent(String(projectId));
  return glFetch<GitLabPipeline>(`/projects/${id}/pipelines/${pipelineId}`);
}

/**
 * List commits on a branch (defaults to the project's default branch).
 */
export async function listCommits(
  projectId: number | string,
  ref?: string,
  perPage = 20,
): Promise<GitLabCommit[]> {
  const id = encodeURIComponent(String(projectId));
  const refParam = ref ? `&ref_name=${encodeURIComponent(ref)}` : '';
  return glFetch<GitLabCommit[]>(
    `/projects/${id}/repository/commits?per_page=${perPage}${refParam}`,
  );
}

/**
 * Search for projects by name.
 */
export async function searchProjects(
  query: string,
  perPage = 10,
): Promise<GitLabProject[]> {
  return glFetch<GitLabProject[]>(
    `/projects?search=${encodeURIComponent(query)}&per_page=${perPage}`,
  );
}
