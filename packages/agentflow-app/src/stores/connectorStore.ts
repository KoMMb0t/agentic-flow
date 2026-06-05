import { create } from 'zustand';

export interface Connector {
  id: string;
  name: string;
  type: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  description: string;
  config: Record<string, string>;
  lastSync?: Date;
}

interface ConnectorStore {
  connectors: Connector[];
  addConnector: (connector: Omit<Connector, 'id' | 'status' | 'lastSync'>) => void;
  removeConnector: (id: string) => void;
  toggleConnection: (id: string) => void;
  updateConfig: (id: string, config: Record<string, string>) => void;
}

const defaultConnectors: Connector[] = [
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
    id: 'github-1',
    name: 'GitHub',
    type: 'vcs',
    icon: '🐙',
    status: 'connected',
    description: 'Code-Repositories und Pull Requests',
    config: { org: 'agentflow-org', repo: 'main' },
    lastSync: new Date(),
  },
  {
    id: 'gitlab-1',
    name: 'GitLab',
    type: 'vcs',
    icon: '🦊',
    status: 'disconnected',
    description: 'Self-hosted Git und CI/CD Pipelines',
    config: { url: '', token: '' },
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
    id: 'terrabox-1',
    name: 'Terrabox',
    type: 'storage',
    icon: '📦',
    status: 'disconnected',
    description: 'Dezentraler Cloud-Speicher',
    config: { endpoint: '', apiKey: '' },
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
    set({ connectors: get().connectors.filter(c => c.id !== id) });
  },

  toggleConnection: (id) => {
    set({
      connectors: get().connectors.map(c => {
        if (c.id !== id) return c;
        if (c.status === 'connected') {
          return { ...c, status: 'disconnected' as const };
        }
        // Simulate connection
        return { ...c, status: 'connecting' as const };
      }),
    });

    // Simulate async connection
    const connector = get().connectors.find(c => c.id === id);
    if (connector && connector.status === 'disconnected') {
      setTimeout(() => {
        set({
          connectors: get().connectors.map(c =>
            c.id === id ? { ...c, status: 'connected' as const, lastSync: new Date() } : c
          ),
        });
      }, 1500);
    }
  },

  updateConfig: (id, config) => {
    set({
      connectors: get().connectors.map(c =>
        c.id === id ? { ...c, config: { ...c.config, ...config } } : c
      ),
    });
  },
}));
