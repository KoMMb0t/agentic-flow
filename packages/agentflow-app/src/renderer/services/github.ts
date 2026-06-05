import type { GitHubRepo, GitHubIssue, GitHubPR, GitHubCommit, GitHubContributor } from '../types';

const USERNAME = 'KoMMb0t';

async function fetchGitHub<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
  if (window.electronAPI) {
    const result = await window.electronAPI.githubRequest(endpoint, method, body);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data as T;
  }
  throw new Error('Electron API nicht verfügbar');
}

// Repositories
export async function getRepos(): Promise<GitHubRepo[]> {
  return fetchGitHub<GitHubRepo[]>(`/users/${USERNAME}/repos?sort=updated&per_page=30`);
}

export async function getRepo(name: string): Promise<GitHubRepo> {
  return fetchGitHub<GitHubRepo>(`/repos/${USERNAME}/${name}`);
}

// Issues
export async function getIssues(repo: string): Promise<GitHubIssue[]> {
  return fetchGitHub<GitHubIssue[]>(`/repos/${USERNAME}/${repo}/issues?state=all&per_page=30`);
}

export async function createIssue(repo: string, title: string, body: string): Promise<GitHubIssue> {
  return fetchGitHub<GitHubIssue>(`/repos/${USERNAME}/${repo}/issues`, 'POST', { title, body });
}

export async function closeIssue(repo: string, issueNumber: number): Promise<GitHubIssue> {
  return fetchGitHub<GitHubIssue>(`/repos/${USERNAME}/${repo}/issues/${issueNumber}`, 'PATCH', { state: 'closed' });
}

// Pull Requests
export async function getPullRequests(repo: string): Promise<GitHubPR[]> {
  return fetchGitHub<GitHubPR[]>(`/repos/${USERNAME}/${repo}/pulls?state=all&per_page=20`);
}

// Commits
export async function getCommits(repo: string): Promise<GitHubCommit[]> {
  return fetchGitHub<GitHubCommit[]>(`/repos/${USERNAME}/${repo}/commits?per_page=20`);
}

export async function getRecentActivity(): Promise<{ repo: string; commits: GitHubCommit[] }[]> {
  const repos = await getRepos();
  const topRepos = repos.slice(0, 5);
  const results = await Promise.all(
    topRepos.map(async (repo) => {
      try {
        const commits = await getCommits(repo.name);
        return { repo: repo.name, commits: commits.slice(0, 5) };
      } catch {
        return { repo: repo.name, commits: [] };
      }
    })
  );
  return results;
}

// Contributors
export async function getContributors(repo: string): Promise<GitHubContributor[]> {
  return fetchGitHub<GitHubContributor[]>(`/repos/${USERNAME}/${repo}/contributors?per_page=30`);
}

// Languages
export async function getLanguages(repo: string): Promise<Record<string, number>> {
  return fetchGitHub<Record<string, number>>(`/repos/${USERNAME}/${repo}/languages`);
}

// User Profile
export async function getUserProfile() {
  return fetchGitHub<any>(`/users/${USERNAME}`);
}

// Repo content for documentation
export async function getRepoContent(repo: string, path: string = ''): Promise<any[]> {
  return fetchGitHub<any[]>(`/repos/${USERNAME}/${repo}/contents/${path}`);
}

export async function getFileContent(repo: string, path: string): Promise<string> {
  const data = await fetchGitHub<any>(`/repos/${USERNAME}/${repo}/contents/${path}`);
  return atob(data.content);
}
