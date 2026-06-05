import React, { useState, useEffect, useCallback } from 'react';
import type { UpdateCheckResult, UpdateResult } from '../types';
import { getApiKey } from '../hooks/useApiKeys';

type UpdateState =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'update-available'
  | 'updating'
  | 'updated'
  | 'error';

interface UpdateButtonProps {
  /** compact = nur Icon + kleiner Badge (für TitleBar), full = volle Karte (für Settings) */
  variant?: 'compact' | 'full';
  /** Automatisch beim Mount prüfen */
  autoCheck?: boolean;
}

function formatDate(iso: string): string {
  if (!iso || iso === 'unknown') return '—';
  try {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function shortSha(sha: string): string {
  return sha ? sha.slice(0, 7) : '—';
}

const UpdateButton: React.FC<UpdateButtonProps> = ({
  variant = 'compact',
  autoCheck = false,
}) => {
  const [state, setState] = useState<UpdateState>('idle');
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Resolve GitHub token: prefer localStorage key, fall back to env
  function getToken(): string | undefined {
    const local = getApiKey('github');
    return local || undefined;
  }

  const handleCheck = useCallback(async () => {
    setState('checking');
    setErrorMsg('');
    setUpdateResult(null);
    try {
      const result = await window.electronAPI.checkUpdate(getToken());
      setCheckResult(result);
      if (result.error) {
        setState('error');
        setErrorMsg(result.error);
      } else if (result.hasUpdate) {
        setState('update-available');
      } else {
        setState('up-to-date');
      }
    } catch (err: any) {
      setState('error');
      setErrorMsg(err.message || 'Unbekannter Fehler');
    }
  }, []);

  const handleUpdate = useCallback(async () => {
    setState('updating');
    setErrorMsg('');
    try {
      const result = await window.electronAPI.doUpdate(getToken());
      setUpdateResult(result);
      if (result.success) {
        setState('updated');
        // Refresh check result with new sha
        if (result.newSha) {
          setCheckResult((prev) => prev ? {
            ...prev,
            localSha: result.newSha,
            localDate: result.newDate,
            localMessage: result.newMessage,
            hasUpdate: false,
          } : null);
        }
      } else {
        setState('error');
        setErrorMsg(result.error || 'Update fehlgeschlagen');
      }
    } catch (err: any) {
      setState('error');
      setErrorMsg(err.message || 'Unbekannter Fehler');
    }
  }, []);

  useEffect(() => {
    if (autoCheck && window.electronAPI) {
      handleCheck();
    }
  }, [autoCheck, handleCheck]);

  // ── Compact variant (TitleBar) ────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => {
            setShowPanel((v) => !v);
            if (state === 'idle') handleCheck();
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
            state === 'update-available'
              ? 'bg-af-warning/20 text-af-warning hover:bg-af-warning/30 border border-af-warning/40'
              : state === 'updated'
                ? 'bg-af-success/20 text-af-success hover:bg-af-success/30'
                : state === 'error'
                  ? 'bg-af-error/20 text-af-error hover:bg-af-error/30'
                  : 'text-af-muted hover:text-af-text hover:bg-af-surface'
          }`}
          title={
            state === 'update-available' ? 'Update verfügbar – klicken für Details'
            : state === 'checking' ? 'Prüfe auf Updates…'
            : state === 'updating' ? 'Update läuft…'
            : state === 'updated' ? 'Neustart empfohlen'
            : state === 'up-to-date' ? 'App ist aktuell'
            : 'Auf Updates prüfen'
          }
        >
          {state === 'checking' || state === 'updating' ? (
            <span className="animate-spin inline-block">⟳</span>
          ) : state === 'update-available' ? (
            <span>⬆</span>
          ) : state === 'updated' ? (
            <span>✓</span>
          ) : state === 'error' ? (
            <span>⚠</span>
          ) : (
            <span>⟳</span>
          )}
          {state === 'update-available' && (
            <span className="font-medium">Update</span>
          )}
          {state === 'updated' && (
            <span className="font-medium">Neustart</span>
          )}
        </button>

        {/* Dropdown panel */}
        {showPanel && (
          <>
            <div
              className="fixed inset-0 z-[150]"
              onClick={() => setShowPanel(false)}
            />
            <div className="absolute right-0 top-8 z-[160] w-72 bg-af-surface border border-af-border rounded-xl shadow-2xl overflow-hidden">
              <UpdatePanel
                state={state}
                checkResult={checkResult}
                updateResult={updateResult}
                errorMsg={errorMsg}
                onCheck={handleCheck}
                onUpdate={handleUpdate}
                onClose={() => setShowPanel(false)}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Full variant (Settings page) ─────────────────────────
  return (
    <div className="bg-af-surface border border-af-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-af-border">
        <div>
          <h3 className="text-sm font-medium text-af-text">App-Update</h3>
          <p className="text-[10px] text-af-muted mt-0.5">
            Synchronisiert mit dem GitHub-Repository
          </p>
        </div>
        <span className="text-[10px] text-af-muted font-mono bg-af-dark px-2 py-0.5 rounded">
          KoMMb0t/agentic-flow
        </span>
      </div>
      <div className="p-4">
        <UpdatePanel
          state={state}
          checkResult={checkResult}
          updateResult={updateResult}
          errorMsg={errorMsg}
          onCheck={handleCheck}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
};

// ── Shared panel content ──────────────────────────────────────
interface UpdatePanelProps {
  state: UpdateState;
  checkResult: UpdateCheckResult | null;
  updateResult: UpdateResult | null;
  errorMsg: string;
  onCheck: () => void;
  onUpdate: () => void;
  onClose?: () => void;
}

const UpdatePanel: React.FC<UpdatePanelProps> = ({
  state, checkResult, updateResult, errorMsg, onCheck, onUpdate, onClose,
}) => {
  return (
    <div className="p-3 space-y-3">
      {/* Current version */}
      {checkResult && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-af-muted uppercase tracking-wider">Lokal</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
              checkResult.isGitRepo
                ? 'bg-af-success/10 text-af-success'
                : 'bg-af-warning/10 text-af-warning'
            }`}>
              {checkResult.isGitRepo ? 'Git-Repo' : 'Paketiert'}
            </span>
          </div>
          <div className="bg-af-dark rounded-lg p-2 font-mono text-[10px] space-y-0.5">
            <div className="flex gap-2">
              <span className="text-af-muted w-12 shrink-0">Commit</span>
              <span className="text-af-accent">{shortSha(checkResult.localSha || '')}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-af-muted w-12 shrink-0">Datum</span>
              <span className="text-af-text">{formatDate(checkResult.localDate || '')}</span>
            </div>
            {checkResult.localMessage && (
              <div className="flex gap-2">
                <span className="text-af-muted w-12 shrink-0">Msg</span>
                <span className="text-af-text truncate">{checkResult.localMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remote version */}
      {checkResult?.remoteSha && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-af-muted uppercase tracking-wider">GitHub (main)</span>
          <div className={`rounded-lg p-2 font-mono text-[10px] space-y-0.5 ${
            checkResult.hasUpdate
              ? 'bg-af-warning/10 border border-af-warning/30'
              : 'bg-af-dark'
          }`}>
            <div className="flex gap-2">
              <span className="text-af-muted w-12 shrink-0">Commit</span>
              <span className={checkResult.hasUpdate ? 'text-af-warning' : 'text-af-accent'}>
                {shortSha(checkResult.remoteSha)}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-af-muted w-12 shrink-0">Datum</span>
              <span className="text-af-text">{formatDate(checkResult.remoteDate || '')}</span>
            </div>
            {checkResult.remoteMessage && (
              <div className="flex gap-2">
                <span className="text-af-muted w-12 shrink-0">Msg</span>
                <span className="text-af-text truncate">{checkResult.remoteMessage}</span>
              </div>
            )}
            {checkResult.remoteAuthor && (
              <div className="flex gap-2">
                <span className="text-af-muted w-12 shrink-0">Von</span>
                <span className="text-af-muted">{checkResult.remoteAuthor}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update result */}
      {updateResult?.success && (
        <div className="bg-af-success/10 border border-af-success/30 rounded-lg p-2.5 text-xs">
          <p className="text-af-success font-medium mb-1">
            {updateResult.alreadyUpToDate ? '✓ Bereits aktuell' : '✓ Update erfolgreich'}
          </p>
          {!updateResult.alreadyUpToDate && (
            <>
              <p className="text-af-muted text-[10px]">
                Neuer Commit: <span className="font-mono text-af-accent">{shortSha(updateResult.newSha || '')}</span>
              </p>
              <p className="text-af-warning text-[10px] mt-1.5 font-medium">
                ⚠ Bitte App neu starten um die Änderungen zu laden.
              </p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {state === 'error' && errorMsg && (
        <div className="bg-af-error/10 border border-af-error/30 rounded-lg p-2.5 text-[10px] text-af-error">
          <p className="font-medium mb-0.5">Fehler</p>
          <p className="text-af-error/80">{errorMsg}</p>
        </div>
      )}

      {/* Status message */}
      {state === 'up-to-date' && !updateResult && (
        <div className="flex items-center gap-2 text-[10px] text-af-success">
          <span className="w-2 h-2 rounded-full bg-af-success" />
          App ist auf dem neuesten Stand.
        </div>
      )}

      {state === 'checking' && (
        <div className="flex items-center gap-2 text-[10px] text-af-muted">
          <span className="animate-spin inline-block">⟳</span>
          Prüfe auf Updates…
        </div>
      )}

      {state === 'updating' && (
        <div className="flex items-center gap-2 text-[10px] text-af-muted">
          <span className="animate-spin inline-block">⟳</span>
          Führe git pull aus…
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {state !== 'updating' && state !== 'checking' && (
          <button
            onClick={onCheck}
            className="flex-1 text-[10px] bg-af-dark hover:bg-af-border text-af-muted hover:text-af-text px-3 py-1.5 rounded-lg transition-colors"
          >
            ⟳ Prüfen
          </button>
        )}

        {(state === 'update-available') && (
          <button
            onClick={onUpdate}
            className="flex-1 text-[10px] bg-af-warning/20 hover:bg-af-warning/30 text-af-warning border border-af-warning/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            ⬆ Jetzt updaten
          </button>
        )}

        {state === 'updated' && !updateResult?.alreadyUpToDate && (
          <button
            onClick={() => window.electronAPI?.close()}
            className="flex-1 text-[10px] bg-af-accent/20 hover:bg-af-accent/30 text-af-accent border border-af-accent/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            ↺ App neu starten
          </button>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="text-[10px] text-af-muted hover:text-af-text px-2 py-1.5 rounded-lg hover:bg-af-dark transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default UpdateButton;
