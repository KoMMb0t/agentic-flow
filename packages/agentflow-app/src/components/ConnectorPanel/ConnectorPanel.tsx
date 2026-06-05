import React, { useState } from 'react';
import { useConnectorStore, Connector } from '../../stores/connectorStore';
import { Plus, Power, PowerOff, Trash2, Settings, Wifi, WifiOff, Loader2 } from 'lucide-react';

export const ConnectorPanel: React.FC = () => {
  const { connectors, addConnector, removeConnector, toggleConnection } = useConnectorStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnector, setNewConnector] = useState({ name: '', type: 'custom', description: '' });

  const connectedCount = connectors.filter(c => c.status === 'connected').length;

  const handleAdd = () => {
    if (!newConnector.name.trim()) return;
    addConnector({
      name: newConnector.name,
      type: newConnector.type,
      icon: '🔌',
      description: newConnector.description || 'Benutzerdefinierter Konnektor',
      config: {},
    });
    setNewConnector({ name: '', type: 'custom', description: '' });
    setShowAddForm(false);
  };

  const getStatusColor = (status: Connector['status']) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-gray-500';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
    }
  };

  const getStatusLabel = (status: Connector['status']) => {
    switch (status) {
      case 'connected': return 'Verbunden';
      case 'disconnected': return 'Getrennt';
      case 'connecting': return 'Verbinde...';
      case 'error': return 'Fehler';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-af-text">Konnektoren</h2>
          <p className="text-xs text-af-text-muted">{connectedCount}/{connectors.length} verbunden</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="af-button-primary text-sm flex items-center gap-1.5"
        >
          <Plus size={14} />
          Hinzufügen
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="af-card mb-4 animate-slide-down">
          <h3 className="text-sm font-semibold mb-3">Neuen Konnektor hinzufügen</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Name des Konnektors"
              value={newConnector.name}
              onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })}
              className="af-input text-sm"
            />
            <select
              value={newConnector.type}
              onChange={(e) => setNewConnector({ ...newConnector, type: e.target.value })}
              className="af-input text-sm"
            >
              <option value="custom">Benutzerdefiniert</option>
              <option value="communication">Kommunikation</option>
              <option value="vcs">Versionskontrolle</option>
              <option value="project-management">Projektmanagement</option>
              <option value="storage">Speicher</option>
            </select>
            <input
              type="text"
              placeholder="Beschreibung (optional)"
              value={newConnector.description}
              onChange={(e) => setNewConnector({ ...newConnector, description: e.target.value })}
              className="af-input text-sm"
            />
            <div className="flex gap-2 pt-1">
              <button onClick={handleAdd} className="af-button-primary text-sm flex-1">Erstellen</button>
              <button onClick={() => setShowAddForm(false)} className="af-button-secondary text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Connector List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {connectors.map((connector) => (
          <div key={connector.id} className="af-card flex items-center gap-3">
            <span className="text-2xl">{connector.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-af-text truncate">{connector.name}</p>
                <span className={`text-xs ${getStatusColor(connector.status)}`}>
                  {connector.status === 'connecting' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : connector.status === 'connected' ? (
                    <Wifi size={12} />
                  ) : (
                    <WifiOff size={12} />
                  )}
                </span>
              </div>
              <p className="text-xs text-af-text-muted truncate">{connector.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  connector.status === 'connected' ? 'bg-green-500/10 text-green-400' :
                  connector.status === 'connecting' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-gray-500/10 text-gray-400'
                }`}>
                  {getStatusLabel(connector.status)}
                </span>
                {connector.lastSync && (
                  <span className="text-[10px] text-af-text-muted">
                    Sync: {connector.lastSync.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleConnection(connector.id)}
                className={`p-1.5 rounded transition-colors ${
                  connector.status === 'connected'
                    ? 'hover:bg-red-500/10 text-green-400 hover:text-red-400'
                    : 'hover:bg-green-500/10 text-af-text-muted hover:text-green-400'
                }`}
                title={connector.status === 'connected' ? 'Trennen' : 'Verbinden'}
              >
                {connector.status === 'connected' ? <Power size={14} /> : <PowerOff size={14} />}
              </button>
              <button
                onClick={() => removeConnector(connector.id)}
                className="p-1.5 rounded hover:bg-red-500/10 text-af-text-muted hover:text-red-400 transition-colors"
                title="Entfernen"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectorPanel;
