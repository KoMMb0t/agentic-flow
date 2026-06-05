import { create } from 'zustand';
import * as GitHubAPI from '../services/github-api';
import * as GitLabAPI from '../services/gitlab-api';

export interface Connector {
  id: string;
  name: string;
  type: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  description: string;
  config: Record<string, string>;
  lastSync?: Date;
  /** Live data fetched from the real API (optional, populated after sync). */
  data?: ConnectorData;
}

/** Generic container for data fetched from a connector's API. */
export interface ConnectorData {
  repos?: GitHubAPI.GitHubRepo[] | GitLabAPI.GitLabProject[];
  issues?: GitHubAPI.GitHubIssue[];
  pullRequests?: GitHubAPI.GitHubPullRequest[];
  mergeRequests?: GitLabAPI.GitLabMergeRequest[];
  pipelines?: GitLabAPI.GitLabPipeline[];
  commits?: GitHubAPI.GitHubCommit[] | GitLabAPI.GitLabCommit[];
  error?: string;
}

interface ConnectorStore {
  connectors: Connector[];
  addConnector: (connector: Omit<Connector, 'id' | 'status' | 'lastSync'>) => void;
  removeConnector: (id: string) => void;
  toggleConnection: (id: string) => void;
  updateConfig: (id: string, config: Record<string, string>) => void;
  /** Fetch live data for a connector and store it in connector.data. */
  syncConnector: (id: string) => Promise<void>;
  /** Sync all currently-connected connectors. */
  syncAll: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Default connectors
// ---------------------------------------------------------------------------

const defaultConnectors: Connector[] = [
  {
    id: 'github-1',
    name: 'GitHub',
    type: 'vcs',
    icon: '🐙',
    status: 'connected',
    description: 'Code-Repositories, Issues, Pull Requests und Commits',
    config: { owner: 'KoMMb0t', repo: 'agentic-flow' },
    lastSync: new Date(),
  },
  {
    id: 'gitlab-1',
    name: 'GitLab',
    type: 'vcs',
    icon: '🦊',
    status: 'disconnected',
    description: 'Self-hosted Git, Merge Requests und CI/CD Pipelines',
    config: { projectId: '', url: 'https://gitlab.com' },
  },
  {
    id: 'claude-1',
    name: 'Claude (Anthropic)',
    type: 'ai',
    icon: '🤖',
    status: 'connected',
    description: 'AI-Assistent für Code-Reviews, Dokumentation und Chat',
    config: { model: 'claude-opus-4-5' },
    lastSync: new Date(),
  },
  {
    id: 'slack-1',
    name: 'Slack',
    type: 'communication',
    icon: '💬',
    status: 'connected',
    description: 'Team-Kommunikation und Benachrichtigungen',
    config: { workspace: 'agentflow-team', channel: '#general' },
    lastSync: new Date(),
  },
  {
    id: 'bitbucket-1',
    name: 'Bitbucket',
    type: 'vcs',
    icon: '🪣',
    status: 'disconnected',
    description: 'Atlassian Code-Management',
    config: { workspace: '', token: '' },
  },
  {
    id: 'clickup-1',
    name: 'ClickUp',
    type: 'project-management',
    icon: '✅',
    status: 'connected',
    description: 'Aufgabenverwaltung und Sprint-Planung',
    config: { workspace: 'agentflow-pm', apiKey: '***' },
    lastSync: new Date(),
  },
  {
    id: 'gdrive-1',
    name: 'Google Drive',
    type: 'storage',
    icon: '📁',
    status: 'connected',
    description: 'Cloud-Speicher und Dokumentenfreigabe',
    config: { folder: '/AgentFlow/Docs' },
    lastSync: new Date(),
  },
  {
    id: 'local-1',
    name: 'Lokaler Speicher',
    type: 'storage',
    icon: '💾',
    status: 'connected',
    description: 'Lokales Dateisystem und Projektordner',
    config: { path: '/home/user/projects' },
    lastSync: new Date(),
  },
];

// ---------------------------------------------------------------------------
// Sync helpers
// ---------------------------------------------------------------------------

async function syncGitHub(connector: Connector): Promise<ConnectorData> {
  try {
    const { owner, repo } = connector.config;
    if (!owner || !repo) {
      return { error: 'GitHub connector: owner and repo must be configured.' };
    }
    const [repos, issues, pullRequests, commits] = await Promise.all([
      GitHubAPI.listUserRepos(10),
      GitHubAPI.listIssues(owner, repo, 'open', 10),
      GitHubAPI.listPullRequests(owner, repo, 'open', 10),
      GitHubAPI.listCommits(owner, repo, undefined, 10),
    ]);
    return { repos, issues, pullRequests, commits };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function syncGitLab(connector: Connector): Promise<ConnectorData> {
  try {
    const { projectId } = connector.config;
    if (!projectId) {
      return { error: 'GitLab connector: projectId must be configured.' };
    }
    const [repos, mergeRequests, pipelines, commits] = await Promise.all([
      GitLabAPI.listProjects(true, 10),
      GitLabAPI.listMergeRequests(projectId, 'opened', 10),
      GitLabAPI.listPipelines(projectId, 10),
      GitLabAPI.listCommits(projectId, undefined, 10),
    ]);
    return { repos, mergeRequests, pipelines, commits };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let connectorIdCounter = 100;

export const useConnectorStore = create<ConnectorStore>((set, get) => ({
  connectors: defaultConnectors,

  addConnector: (connector) => {
    const id = `connector-${++connectorIdCounter}`;
    set({
      connectors: [
        ...get().connectors,
        { ...connector, id, status: 'disconnected' as const },
      ],
    });
  },

  removeConnector: (id) => {
    set({ connectors: get().connectors.filter((c) => c.id !== id) });
  },

  toggleConnection: (id) => {
    const connector = get().connectors.find((c) => c.id === id);
    if (!connector) return;

    if (connector.status === 'connected') {
      set({
        connectors: get().connectors.map((c) =>
          c.id === id ? { ...c, status: 'disconnected' as const, data: undefined } : c,
        ),
      });
      return;
    }

    set({
      connectors: get().connectors.map((c) =>
        c.id === id ? { ...c, status: 'connecting' as const } : c,
      ),
    });

    get()
      .syncConnector(id)
      .then(() => {
        set({
          connectors: get().connectors.map((c) => {
            if (c.id !== id) return c;
            const hasError = !!c.data?.error;
            return {
              ...c,
              status: hasError ? ('error' as const) : ('connected' as const),
              lastSync: new Date(),
            };
          }),
        });
      })
      .catch(() => {
        set({
          connectors: get().connectors.map((c) =>
            c.id === id ? { ...c, status: 'error' as const } : c,
          ),
        });
      });
  },

  updateConfig: (id, config) => {
    set({
      connectors: get().connectors.map((c) =>
        c.id === id ? { ...c, config: { ...c.config, ...config } } : c,
      ),
    });
  },

  syncConnector: async (id) => {
    const connector = get().connectors.find((c) => c.id === id);
    if (!connector) return;

    let data: ConnectorData | undefined;

    if (connector.id.startsWith('github')) {
      data = await syncGitHub(connector);
    } else if (connector.id.startsWith('gitlab')) {
      data = await syncGitLab(connector);
    }

    set({
      connectors: get().connectors.map((c) =>
        c.id === id ? { ...c, data, lastSync: new Date() } : c,
      ),
    });
  },

  syncAll: async () => {
    const connected = get().connectors.filter((c) => c.status === 'connected');
    await Promise.allSettled(connected.map((c) => get().syncConnector(c.id)));
  },
}));
