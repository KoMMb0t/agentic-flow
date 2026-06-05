import React, { useState, useEffect, useRef } from 'react';
import type { Connector } from '../types';
import { useApiKeys } from '../hooks/useApiKeys';

interface ApiKeyModalProps {
  connector: Connector;
  onClose: () => void;
  onSaved: (connectorId: string) => void;
}

/** Metadaten pro Konnektor: Anleitung + Placeholder + Link zur Key-Seite */
const CONNECTOR_META: Record<string, { label: string; placeholder: string; helpUrl: string; helpText: string; extraField?: { key: string; label: string; placeholder: string } }> = {
  github: {
    label: 'GitHub Personal Access Token',
    placeholder: 'ghp_...',
    helpUrl: 'https://github.com/settings/tokens',
    helpText: 'Erstelle ein Token unter Settings → Developer settings → Personal access tokens',
  },
  gitlab: {
    label: 'GitLab Personal Access Token',
    placeholder: 'glpat-...',
    helpUrl: 'https://gitlab.com/-/profile/personal_access_tokens',
    helpText: 'Erstelle ein Token unter User Settings → Access Tokens',
  },
  anthropic: {
    label: 'Anthropic API Key',
    placeholder: 'sk-ant-api03-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpText: 'Erstelle einen API Key in der Anthropic Console',
  },
  openrouter: {
    label: 'OpenRouter API Key',
    placeholder: 'sk-or-v1-...',
    helpUrl: 'https://openrouter.ai/keys',
    helpText: 'Erstelle einen API Key unter openrouter.ai/keys',
  },
  slack: {
    label: 'Slack Bot Token',
    placeholder: 'xoxb-...',
    helpUrl: 'https://api.slack.com/apps',
    helpText: 'Erstelle eine Slack App und kopiere den Bot User OAuth Token',
    extraField: { key: 'channel', label: 'Standard-Channel', placeholder: '#agentflow' },
  },
  clickup: {
    label: 'ClickUp API Token',
    placeholder: 'pk_...',
    helpUrl: 'https://app.clickup.com/settings/apps',
    helpText: 'Erstelle einen API Token unter ClickUp Settings → Apps',
    extraField: { key: 'workspaceId', label: 'Workspace ID', placeholder: '12345678' },
  },
  googledrive: {
    label: 'Google API Key / OAuth Token',
    placeholder: 'AIza... oder ya29...',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    helpText: 'Erstelle Credentials in der Google Cloud Console (Drive API aktivieren)',
  },
};

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

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ connector, onClose, onSaved }) => {
  const { save, get, has, remove } = useApiKeys();
  const meta = CONNECTOR_META[connector.id] || {
    label: `${connector.name} API Key`,
    placeholder: 'API Key eingeben...',
    helpUrl: connector.baseUrl,
    helpText: `API Key für ${connector.name}`,
  };

  const existingKey = get(connector.id);
  const isConnected = has(connector.id);

  const [apiKey, setApiKey] = useState('');
  const [extraValue, setExtraValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Prefill with existing key for editing
    if (existingKey) {
      setApiKey(existingKey);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  async function handleTest() {
    const keyToTest = apiKey.trim();
    if (!keyToTest) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      // Temporarily save key so main process can use it via IPC
      save(connector.id, keyToTest);

      if (window.electronAPI) {
        const result = await window.electronAPI.pingConnectorWithKey(connector.id, keyToTest);
        setTestResult({
          ok: result.status === 'online',
          message: result.status === 'online'
            ? `Verbindung erfolgreich (${result.latency}ms)`
            : result.message || 'Verbindung fehlgeschlagen',
        });
      } else {
        // Fallback: basic fetch test
        setTestResult({ ok: true, message: 'Key gespeichert (kein Electron – kein Live-Test möglich)' });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  }

  function handleSave() {
    const keyToSave = apiKey.trim();
    if (!keyToSave) return;
    save(connector.id, keyToSave);
    onSaved(connector.id);
    onClose();
  }

  function handleDelete() {
    remove(connector.id);
    onSaved(connector.id);
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-af-surface border border-af-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-af-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-af-dark flex items-center justify-center text-lg">
              {getTypeIcon(connector.type)}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-af-text">{connector.name}</h2>
              <p className="text-[10px] text-af-muted">API-Key verbinden</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-af-muted hover:text-af-text hover:bg-af-dark transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current status */}
          {isConnected && (
            <div className="flex items-center gap-2 bg-af-success/10 border border-af-success/30 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-af-success" />
              <span className="text-xs text-af-success">Bereits verbunden</span>
              <button
                onClick={handleDelete}
                className="ml-auto text-[10px] text-af-error hover:underline"
              >
                Verbindung trennen
              </button>
            </div>
          )}

          {/* Key input */}
          <div>
            <label className="text-[10px] text-af-muted uppercase tracking-wider block mb-1.5">
              {meta.label}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={meta.placeholder}
                className="w-full bg-af-dark border border-af-border rounded-lg px-3 py-2.5 pr-10 text-sm text-af-text placeholder-af-muted/50 focus:outline-none focus:ring-1 focus:ring-af-accent font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-af-muted hover:text-af-text text-xs"
                title={showKey ? 'Verbergen' : 'Anzeigen'}
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Extra field (e.g. channel, workspace ID) */}
          {meta.extraField && (
            <div>
              <label className="text-[10px] text-af-muted uppercase tracking-wider block mb-1.5">
                {meta.extraField.label}
              </label>
              <input
                type="text"
                value={extraValue}
                onChange={(e) => setExtraValue(e.target.value)}
                placeholder={meta.extraField.placeholder}
                className="w-full bg-af-dark border border-af-border rounded-lg px-3 py-2 text-sm text-af-text placeholder-af-muted/50 focus:outline-none focus:ring-1 focus:ring-af-accent"
              />
            </div>
          )}

          {/* Help text */}
          <div className="bg-af-dark rounded-lg px-3 py-2.5 text-[10px] text-af-muted">
            <p>{meta.helpText}</p>
            <a
              href={meta.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-af-accent hover:underline mt-1 block"
            >
              {meta.helpUrl} ↗
            </a>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 text-[10px] text-af-muted">
            <span className="text-af-warning mt-0.5">🔒</span>
            <span>
              Der Key wird ausschließlich lokal auf deinem Gerät gespeichert (localStorage).
              Er wird niemals in Dateien geschrieben oder committed.
            </span>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`rounded-lg px-3 py-2 text-xs ${
              testResult.ok
                ? 'bg-af-success/10 border border-af-success/30 text-af-success'
                : 'bg-af-error/10 border border-af-error/30 text-af-error'
            }`}>
              {testResult.ok ? '✓ ' : '✗ '}{testResult.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-af-border bg-af-dark/30">
          <button
            onClick={handleTest}
            disabled={!apiKey.trim() || isTesting}
            className="text-xs text-af-muted hover:text-af-accent disabled:opacity-40 px-3 py-1.5 rounded-lg hover:bg-af-dark transition-colors"
          >
            {isTesting ? '⟳ Teste...' : '⚡ Verbindung testen'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-af-muted hover:text-af-text px-3 py-1.5 rounded-lg hover:bg-af-dark transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="text-xs bg-af-accent hover:bg-af-accent-hover disabled:opacity-40 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
            >
              {isConnected ? 'Key aktualisieren' : 'Verbinden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
