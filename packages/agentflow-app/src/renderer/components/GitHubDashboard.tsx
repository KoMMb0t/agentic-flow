import React, { useState, useEffect } from 'react';
import { getRepos, getRecentActivity } from '../services/github';
import type { GitHubRepo, GitHubCommit } from '../types';

const GitHubDashboard: React.FC = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [activity, setActivity] = useState<{ repo: string; commits: GitHubCommit[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [repoData, activityData] = await Promise.all([
        getRepos(),
        getRecentActivity(),
      ]);
      setRepos(repoData);
      setActivity(activityData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-af-muted text-sm animate-pulse">GitHub-Daten werden geladen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-af-error text-sm mb-2">Fehler: {error}</p>
          <button onClick={loadData} className="text-xs text-af-accent hover:underline">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-af-text">GitHub Dashboard</h2>
        <button onClick={loadData} className="text-xs text-af-muted hover:text-af-accent transition-colors">
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Repositories" value={repos.length} color="af-accent" />
        <StatCard label="Stars" value={totalStars} color="af-warning" />
        <StatCard label="Forks" value={totalForks} color="af-success" />
        <StatCard label="Sprachen" value={languages.length} color="purple-400" />
      </div>

      {/* Recent Activity */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-af-text mb-3">Letzte Aktivität</h3>
        <div className="space-y-3">
          {activity.map(({ repo, commits }) => (
            <div key={repo}>
              <div className="text-xs font-medium text-af-accent mb-1">{repo}</div>
              {commits.slice(0, 3).map((commit) => (
                <div key={commit.sha} className="flex items-start gap-2 ml-3 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-af-muted mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-af-text truncate">{commit.commit.message}</p>
                    <p className="text-[9px] text-af-muted">
                      {commit.commit.author.name} - {new Date(commit.commit.author.date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Repositories */}
      <div>
        <h3 className="text-sm font-medium text-af-text mb-3">Repositories</h3>
        <div className="grid gap-2">
          {repos.slice(0, 10).map((repo) => (
            <div key={repo.id} className="bg-af-surface border border-af-border rounded-lg p-3 hover:border-af-accent/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="text-xs font-medium text-af-text truncate">{repo.name}</h4>
                  <p className="text-[10px] text-af-muted truncate">{repo.description || 'Keine Beschreibung'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {repo.language && (
                    <span className="text-[10px] text-af-muted">{repo.language}</span>
                  )}
                  <span className="text-[10px] text-af-warning">★ {repo.stargazers_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="bg-af-surface border border-af-border rounded-xl p-3 text-center">
    <div className={`text-xl font-bold text-${color}`}>{value}</div>
    <div className="text-[10px] text-af-muted mt-0.5">{label}</div>
  </div>
);

export default GitHubDashboard;
