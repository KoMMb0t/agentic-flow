import React from 'react';
import { useAppStore } from '../stores/appStore';

const AgentRegistry: React.FC = () => {
  const { agents, updateAgentStatus, updateAgentConfig } = useAppStore();

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-af-text">Agent Registry</h2>
        <span className="text-xs text-af-muted">
          {agents.filter((a) => a.status === 'online').length}/{agents.length} online
        </span>
      </div>

      <div className="grid gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-af-surface border border-af-border rounded-xl p-4 hover:border-af-accent/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${agent.color}20` }}
              >
                {agent.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-af-text">{agent.name}</h3>
                  <span className={`w-2 h-2 rounded-full ${
                    agent.status === 'online' ? 'bg-af-success' :
                    agent.status === 'not_configured' ? 'bg-af-warning' : 'bg-af-error'
                  }`} />
                  <span className="text-[10px] text-af-muted capitalize">{agent.status.replace('_', ' ')}</span>
                  {agent.isReal && (
                    <span className="text-[9px] bg-af-success/20 text-af-success px-1.5 py-0.5 rounded-full">
                      ECHT
                    </span>
                  )}
                </div>
                <p className="text-xs text-af-muted mt-0.5">{agent.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap.name}
                      className="text-[10px] bg-af-dark px-1.5 py-0.5 rounded text-af-muted"
                      title={cap.description}
                    >
                      {cap.name}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-af-muted">
                  <span>Model: {agent.config.model}</span>
                  <span className="mx-2">|</span>
                  <span>Endpoint: {agent.config.endpoint}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentRegistry;
