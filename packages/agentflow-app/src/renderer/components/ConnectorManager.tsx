import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import type { Connector } from '../types';

const ConnectorManager: React.FC = () => {
  const { connectors, setConnectors, toggleConnector, updateConnectorStatus, addNotification } = useAppStore();
  const [pinging, setPinging] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { latency: number; message: string }>>({});

  useEffect(() => {
    loadConnectors();
  }, []);

  async function loadConnectors() {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.readConnectors();
        setConnectors(data.connectors || []);
      } catch (err) {
        console.error('Failed to load connectors:', err);
      }
    }
  }

  async function handlePing(connector: Connector) {
    setPinging(connector.id);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.pingConnector(connector.id);
        updateConnectorStatus(connector.id, result.status);
        setPingResults((prev) => ({
          ...prev,
          [connector.id]: { latency: result.latency, message: result.message },
        }));
        addNotification({
          type: result.status === 'online' ? 'success' : 'error',
          title: `${connector.name} Ping`,
          message: result.status === 'online'
            ? `Verbunden (${result.latency}ms)`
            : result.message,
        });
      }
    } catch (error: any) {
      updateConnectorStatus(connector.id, 'error');
      addNotification({
        type: 'error',
        title: `${connector.name} Fehler`,
        message: error.message,
      });
    } finally {
      setPinging(null);
    }
  }

  async function handlePingAll() {
    for (const connector of connectors.filter((c) => c.enabled)) {
      await handlePing(connector);
    }
  }

  async function handleToggle(connector: Connector) {
    toggleConnector(connector.id);
    addNotification({
      type: 'info',
      title: connector.enabled ? 'Konnektor deaktiviert' : 'Konnektor aktiviert',
      message: connector.name,
    });
    if (window.electronAPI) {
      const updatedConnectors = connectors.map((c) =>
        c.id === connector.id ? { ...c, enabled: !c.enabled } : c
      );
      await window.electronAPI.writeConnectors(JSON.stringify({ connectors: updatedConnectors }, null, 2));
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-af-success';
      case 'offline': return 'bg-af-muted';
      case 'error': return 'bg-af-error';
      default: return 'bg-af-warning';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'git': return '📦';
      case 'ai': return '🧠';
      case 'communication': return '💬';
      case 'ci': return '🔄';
      default: return '🔌';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-af-text">Konnektor-Management</h2>
        <button
          onClick={handlePingAll}
          className="text-xs bg-af-accent hover:bg-af-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Alle pingen
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="grid gap-3">
        {connectors.map((connector) => (
          <div
            key={connector.id}
            className={`bg-af-surface border rounded-xl p-4 transition-colors ${
              connector.enabled ? 'border-af-border hover:border-af-accent/30' : 'border-af-border/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-af-dark flex items-center justify-center text-lg">
                  {getTypeIcon(connector.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-af-text">{connector.name}</h3>
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(connector.status)}`} />
                    <span className="text-[10px] text-af-muted capitalize">{connector.status}</span>
                  </div>
                  <p className="text-[10px] text-af-muted mt-0.5">{connector.description}</p>
                  <p className="text-[9px] text-af-muted mt-1">{connector.baseUrl}</p>
                  {pingResults[connector.id] && (
                    <p className="text-[9px] text-af-accent mt-1">
                      {pingResults[connector.id].message}
                      {pingResults[connector.id].latency > 0 && ` (${pingResults[connector.id].latency}ms)`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePing(connector)}
                  disabled={pinging === connector.id || !connector.enabled}
                  className="text-[10px] text-af-muted hover:text-af-accent px-2 py-1 rounded hover:bg-af-dark transition-colors disabled:opacity-50"
                >
                  {pinging === connector.id ? '...' : 'Ping'}
                </button>
                <button
                  onClick={() => handleToggle(connector)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    connector.enabled ? 'bg-af-accent' : 'bg-af-border'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    connector.enabled ? 'left-4.5 translate-x-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectorManager;
