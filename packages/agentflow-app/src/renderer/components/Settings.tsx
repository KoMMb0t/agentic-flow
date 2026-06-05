import React from 'react';
import { useAppStore } from '../stores/appStore';

const Settings: React.FC = () => {
  const { agents, updateAgentConfig } = useAppStore();

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold text-af-text">Einstellungen</h2>

      {/* Info */}
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

      {/* API Configuration Info */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-af-text mb-2">API-Konfiguration</h3>
        <div className="text-xs text-af-muted space-y-2">
          <p>
            API-Keys werden sicher in der <code className="bg-af-dark px-1 py-0.5 rounded">.env</code> Datei gespeichert
            und über IPC-Channels an den Main-Prozess übergeben. Sie sind niemals im Renderer-Prozess sichtbar.
          </p>
          <div className="bg-af-dark rounded-lg p-3 font-mono text-[10px]">
            <p># .env Datei im Projektroot</p>
            <p>ANTHROPIC_API_KEY=sk-ant-...</p>
            <p>GITHUB_TOKEN=ghp_...</p>
            <p>GITLAB_TOKEN=glpat-...</p>
            <p>ANTHROPIC_MODEL=claude-sonnet-4-20250514</p>
            <p>GITHUB_USERNAME=KoMMb0t</p>
          </div>
        </div>
      </div>

      {/* Agent Models */}
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

      {/* Keyboard Shortcuts */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-af-text mb-3">Tastenkürzel</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-af-muted">Multi-Agent Chat</span>
            <kbd className="bg-af-dark px-1.5 py-0.5 rounded text-[10px]">Ctrl+1</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-af-muted">GitHub Dashboard</span>
            <kbd className="bg-af-dark px-1.5 py-0.5 rounded text-[10px]">Ctrl+2</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-af-muted">Aufgaben</span>
            <kbd className="bg-af-dark px-1.5 py-0.5 rounded text-[10px]">Ctrl+3</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-af-muted">Skills</span>
            <kbd className="bg-af-dark px-1.5 py-0.5 rounded text-[10px]">Ctrl+4</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
