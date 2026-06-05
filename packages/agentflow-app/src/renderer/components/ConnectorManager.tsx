import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useApiKeys } from '../hooks/useApiKeys';
import ApiKeyModal from './ApiKeyModal';
import type { Connector } from '../types';

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

const ConnectorManager: React.FC = () => {
  const { connectors, setConnectors, toggleConnector, updateConnectorStatus, addNotification } = useAppStore();
  const { keys, save: saveKey, remove: removeKey, has: hasKey, refresh: refreshKeys } = useApiKeys();
  const [pinging, setPinging] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { latency: number; message: string }>>({});
  const [modalConnector, setModalConnector] = useState<Connector | null>(null);

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
        // Pass locally stored key so main process can use it for the ping
        const localKey = keys[connector.id]
          ? (() => {
              try { return atob(keys[connector.id].encoded); } catch { return ''; }
            })()
          : '';

        const result = localKey
          ? await window.electronAPI.pingConnectorWithKey(connector.id, localKey)
          : await window.electronAPI.pingConnector(connector.id);

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

  function handleKeySaved(connectorId: string) {
    refreshKeys();
    // Mark connector as online if key was saved
    updateConnectorStatus(connectorId, 'online');
    addNotification({
      type: 'success',
      title: 'API-Key gespeichert',
      message: `${connectors.find((c) => c.id === connectorId)?.name || connectorId} ist jetzt verbunden.`,
    });
  }

  function handleKeyRemoved(connectorId: string) {
    removeKey(connectorId);
    refreshKeys();
    updateConnectorStatus(connectorId, 'unknown');
    addNotification({
      type: 'info',
      title: 'Verbindung getrennt',
      message: `API-Key für ${connectors.find((c) => c.id === connectorId)?.name || connectorId} wurde gelöscht.`,
    });
  }

  const getStatusColor = (connector: Connector) => {
    if (hasKey(connector.id)) return 'bg-af-success';
    switch (connector.status) {
      case 'online': return 'bg-af-success';
      case 'offline': return 'bg-af-muted';
      case 'error': return 'bg-af-error';
      default: return 'bg-af-warning';
    }
  };

  const getStatusLabel = (connector: Connector) => {
    if (hasKey(connector.id) && connector.status !== 'error') return 'verbunden';
    switch (connector.status) {
      case 'online': return 'online';
      case 'offline': return 'offline';
      case 'error': return 'fehler';
      default: return 'nicht verbunden';
    }
  };

  const connectedCount = connectors.filter((c) => hasKey(c.id)).length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-af-text">Konnektor-Management</h2>
          <p className="text-[10px] text-af-muted mt-0.5">
            {connectedCount} von {connectors.length} Konnektoren verbunden
          </p>
        </div>
        <button
          onClick={handlePingAll}
          className="text-xs bg-af-accent hover:bg-af-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Alle pingen
        </button>
      </div>

      {/* Connection Status Summary */}
      <div className="grid grid-cols-4 gap-2">
        {connectors.slice(0, 4).map((c) => (
          <div
            key={c.id}
            className={`rounded-lg p-2 text-center border ${
              hasKey(c.id)
                ? 'bg-af-success/10 border-af-success/30'
                : 'bg-af-surface border-af-border'
            }`}
          >
            <div className="text-base">{getTypeIcon(c.type)}</div>
            <div className="text-[9px] text-af-muted mt-0.5 truncate">{c.name}</div>
            <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${getStatusColor(c)}`} />
          </div>
        ))}
      </div>

      {/* Connectors List */}
      <div className="grid gap-3">
        {connectors.map((connector) => {
          const connected = hasKey(connector.id);
          const storedKey = keys[connector.id];

          return (
            <div
              key={connector.id}
              className={`bg-af-surface border rounded-xl p-4 transition-all ${
                connected
                  ? 'border-af-success/40 shadow-[0_0_12px_rgba(34,197,94,0.06)]'
                  : connector.enabled
                    ? 'border-af-border hover:border-af-accent/30'
                    : 'border-af-border/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Icon + Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                    connected ? 'bg-af-success/10' : 'bg-af-dark'
                  }`}>
                    {getTypeIcon(connector.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-af-text">{connector.name}</h3>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(connector)}`} />
                      <span className={`text-[10px] capitalize ${connected ? 'text-af-success' : 'text-af-muted'}`}>
                        {getStatusLabel(connector)}
                      </span>
                      {connected && storedKey && (
                        <span className="text-[9px] bg-af-success/10 text-af-success px-1.5 py-0.5 rounded-full">
                          Key gespeichert
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-af-muted mt-0.5">{connector.description}</p>

                    {/* Key hint */}
                    {connected && storedKey && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-mono text-af-muted bg-af-dark px-2 py-0.5 rounded">
                          {storedKey.hint}
                        </span>
                        <span className="text-[9px] text-af-muted">
                          gespeichert {new Date(storedKey.savedAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    )}

                    {/* Ping result */}
                    {pingResults[connector.id] && (
                      <p className="text-[9px] text-af-accent mt-1">
                        {pingResults[connector.id].message}
                        {pingResults[connector.id].latency > 0 && ` (${pingResults[connector.id].latency}ms)`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Ping */}
                  <button
                    onClick={() => handlePing(connector)}
                    disabled={pinging === connector.id}
                    className="text-[10px] text-af-muted hover:text-af-accent px-2 py-1 rounded hover:bg-af-dark transition-colors disabled:opacity-50"
                    title="Verbindung testen"
                  >
                    {pinging === connector.id ? '⟳' : '⚡'}
                  </button>

                  {/* Connect / Edit key button */}
                  <button
                    onClick={() => setModalConnector(connector)}
                    className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      connected
                        ? 'bg-af-success/15 text-af-success hover:bg-af-success/25 border border-af-success/30'
                        : 'bg-af-accent/15 text-af-accent hover:bg-af-accent/25 border border-af-accent/30'
                    }`}
                  >
                    {connected ? '✓ Verbunden' : '🔑 API-Key verbinden'}
                  </button>

                  {/* Disconnect (only if connected) */}
                  {connected && (
                    <button
                      onClick={() => handleKeyRemoved(connector.id)}
                      className="text-[10px] text-af-error hover:bg-af-error/10 px-1.5 py-1 rounded transition-colors"
                      title="Verbindung trennen"
                    >
                      ✕
                    </button>
                  )}

                  {/* Toggle enable/disable */}
                  <button
                    onClick={() => handleToggle(connector)}
                    className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                      connector.enabled ? 'bg-af-accent' : 'bg-af-border'
                    }`}
                    title={connector.enabled ? 'Deaktivieren' : 'Aktivieren'}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                      connector.enabled ? 'left-[18px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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

export default ConnectorManager;
