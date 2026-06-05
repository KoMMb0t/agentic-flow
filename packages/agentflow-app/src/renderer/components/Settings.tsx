import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { useApiKeys } from '../hooks/useApiKeys';
import ApiKeyModal from './ApiKeyModal';
import type { Connector } from '../types';

// Inline connector definitions for the Settings page (subset of the full list)
const QUICK_CONNECTORS: Connector[] = [
  {
    id: 'github',
    name: 'GitHub',
    type: 'git',
    icon: 'github',
    description: 'Repository-Management, Issues, PRs',
    baseUrl: 'https://api.github.com',
    enabled: true,
    status: 'unknown',
    config: {},
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    type: 'git',
    icon: 'gitlab',
    description: 'Repository-Management, CI/CD',
    baseUrl: 'https://gitlab.com/api/v4',
    enabled: true,
    status: 'unknown',
    config: {},
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    type: 'ai',
    icon: 'brain',
    description: 'Claude AI – Chat, Analyse, Code',
    baseUrl: 'https://api.anthropic.com/v1',
    enabled: true,
    status: 'unknown',
    config: {},
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'ai',
    icon: 'sparkles',
    description: '200+ KI-Modelle (GPT-4, Gemini, Mistral…)',
    baseUrl: 'https://openrouter.ai/api/v1',
    enabled: true,
    status: 'unknown',
    config: {},
  },
  {
    id: 'slack',
    name: 'Slack',
    type: 'communication',
    icon: 'message-square',
    description: 'Team-Kommunikation & Benachrichtigungen',
    baseUrl: 'https://slack.com/api',
    enabled: true,
    status: 'unknown',
    config: {},
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    type: 'pm',
    icon: 'check-square',
    description: 'Projektmanagement & Aufgaben',
    baseUrl: 'https://api.clickup.com/api/v2',
    enabled: true,
    status: 'unknown',
    config: {},
  },
  {
    id: 'googledrive',
    name: 'Google Drive',
    type: 'storage',
    icon: 'hard-drive',
    description: 'Datei-Speicherung, Docs & Sheets',
    baseUrl: 'https://www.googleapis.com/drive/v3',
    enabled: true,
    status: 'unknown',
    config: {},
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'git': return '📦';
    case 'ai': return '🧠';
    case 'communication': return '💬';
    case 'pm': return '✅';
    case 'storage': return '💾';
    default: return '🔌';
  }
};

const Settings: React.FC = () => {
  const { agents } = useAppStore();
  const { keys, remove: removeKey, has: hasKey, refresh: refreshKeys } = useApiKeys();
  const [modalConnector, setModalConnector] = useState<Connector | null>(null);

  function handleKeySaved(connectorId: string) {
    refreshKeys();
  }

  function handleKeyRemoved(connectorId: string) {
    removeKey(connectorId);
    refreshKeys();
  }

  const connectedCount = QUICK_CONNECTORS.filter((c) => hasKey(c.id)).length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold text-af-text">Einstellungen</h2>

      {/* ── API-Verbindungen ─────────────────────────────────── */}
      <div className="bg-af-surface border border-af-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-af-border">
          <div>
            <h3 className="text-sm font-medium text-af-text">API-Verbindungen</h3>
            <p className="text-[10px] text-af-muted mt-0.5">
              {connectedCount} von {QUICK_CONNECTORS.length} verbunden
            </p>
          </div>
          <div className="flex gap-1">
            {QUICK_CONNECTORS.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className={`w-2 h-2 rounded-full ${hasKey(c.id) ? 'bg-af-success' : 'bg-af-border'}`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="divide-y divide-af-border/50">
          {QUICK_CONNECTORS.map((connector) => {
            const connected = hasKey(connector.id);
            const storedKey = keys[connector.id];

            return (
              <div key={connector.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                    connected ? 'bg-af-success/10' : 'bg-af-dark'
                  }`}>
                    {getTypeIcon(connector.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-af-text">{connector.name}</span>
                      {connected && (
                        <span className="text-[9px] bg-af-success/15 text-af-success px-1.5 py-0.5 rounded-full border border-af-success/30">
                          verbunden
                        </span>
                      )}
                    </div>
                    {connected && storedKey ? (
                      <span className="text-[9px] font-mono text-af-muted">{storedKey.hint}</span>
                    ) : (
                      <span className="text-[9px] text-af-muted">{connector.description}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {connected && (
                    <button
                      onClick={() => handleKeyRemoved(connector.id)}
                      className="text-[9px] text-af-error hover:underline px-1"
                      title="Verbindung trennen"
                    >
                      Trennen
                    </button>
                  )}
                  <button
                    onClick={() => setModalConnector(connector)}
                    className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      connected
                        ? 'bg-af-success/10 text-af-success hover:bg-af-success/20 border border-af-success/30'
                        : 'bg-af-accent/10 text-af-accent hover:bg-af-accent/20 border border-af-accent/30'
                    }`}
                  >
                    {connected ? '✓ Bearbeiten' : '🔑 Verbinden'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Über AgentFlow ──────────────────────────────────── */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-af-text mb-2">Über AgentFlow</h3>
        <div className="text-xs text-af-muted space-y-1">
          <p>Version: 2.0.0 (Unified)</p>
          <p>Autor: KoMMb0t</p>
          <p>Lizenz: MIT</p>
          <p className="mt-2">
            AgentFlow vereint Multi-Agent Chat, GitHub Dashboard, Skill-Marktplatz,
            Dokumentations-Generator, Aufgabenverwaltung und Konnektor-Management in einer App.
          </p>
        </div>
      </div>

      {/* ── Sicherheitshinweis ──────────────────────────────── */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-af-text mb-2">Datenschutz & Sicherheit</h3>
        <div className="text-xs text-af-muted space-y-2">
          <p>
            API-Keys, die über die UI eingegeben werden, werden ausschließlich im
            <code className="bg-af-dark px-1 py-0.5 rounded mx-1">localStorage</code>
            deines Geräts gespeichert. Sie verlassen niemals die App und werden
            nicht in Dateien oder Git-Repositories geschrieben.
          </p>
          <p>
            Für maximale Sicherheit kannst du Keys alternativ in der
            <code className="bg-af-dark px-1 py-0.5 rounded mx-1">.env</code>
            Datei konfigurieren (wird von .gitignore ausgeschlossen).
          </p>
          <div className="bg-af-dark rounded-lg p-3 font-mono text-[10px] mt-2">
            <p className="text-af-muted"># .env (niemals committed)</p>
            <p>ANTHROPIC_API_KEY=sk-ant-...</p>
            <p>GITHUB_TOKEN=ghp_...</p>
            <p>GITLAB_TOKEN=glpat-...</p>
          </div>
        </div>
      </div>

      {/* ── Agent-Modelle ───────────────────────────────────── */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-af-text mb-3">Agent-Modelle</h3>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{agent.avatar}</span>
                <span className="text-xs text-af-text">{agent.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  agent.status === 'online' ? 'bg-af-success' :
                  agent.status === 'not_configured' ? 'bg-af-warning' : 'bg-af-error'
                }`} />
              </div>
              <span className="text-[10px] text-af-muted font-mono">{agent.config.model}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tastenkürzel ────────────────────────────────────── */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-af-text mb-3">Tastenkürzel</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['Multi-Agent Chat', 'Ctrl+1'],
            ['GitHub Dashboard', 'Ctrl+2'],
            ['Aufgaben', 'Ctrl+3'],
            ['Skills', 'Ctrl+4'],
          ].map(([label, shortcut]) => (
            <div key={label} className="flex justify-between">
              <span className="text-af-muted">{label}</span>
              <kbd className="bg-af-dark px-1.5 py-0.5 rounded text-[10px]">{shortcut}</kbd>
            </div>
          ))}
        </div>
      </div>

      {/* API Key Modal */}
      {modalConnector && (
        <ApiKeyModal
          connector={modalConnector}
          onClose={() => setModalConnector(null)}
          onSaved={handleKeySaved}
        />
      )}
    </div>
  );
};

export default Settings;
