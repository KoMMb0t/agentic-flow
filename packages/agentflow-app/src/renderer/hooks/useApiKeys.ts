/**
 * useApiKeys – lokale Verwaltung von API-Keys via localStorage.
 *
 * Sicherheitshinweis: Keys werden im localStorage des Electron-Renderers
 * gespeichert. Da Electron-Apps kein Browser-Netzwerk-Sharing haben, ist
 * localStorage hier nur lokal auf dem Gerät zugänglich. Für maximale
 * Sicherheit werden Keys obfuskiert (Base64) gespeichert – kein echtes
 * Verschlüsseln, aber verhindert versehentliches Lesen in Logs.
 */

const STORAGE_KEY = 'af_api_keys_v1';

export interface StoredKey {
  connectorId: string;
  /** Obfuskierter Key (Base64) */
  encoded: string;
  /** Anzeige-Hint: erste 4 + letzte 4 Zeichen */
  hint: string;
  savedAt: string;
}

function encode(raw: string): string {
  return btoa(unescape(encodeURIComponent(raw)));
}

function decode(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return '';
  }
}

function makeHint(raw: string): string {
  if (raw.length <= 8) return '••••••••';
  return `${raw.slice(0, 4)}${'•'.repeat(Math.min(raw.length - 8, 12))}${raw.slice(-4)}`;
}

function loadAll(): Record<string, StoredKey> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, StoredKey>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Public API ────────────────────────────────────────────────

/** Speichert einen API-Key für einen Konnektor. */
export function saveApiKey(connectorId: string, rawKey: string): StoredKey {
  const all = loadAll();
  const entry: StoredKey = {
    connectorId,
    encoded: encode(rawKey),
    hint: makeHint(rawKey),
    savedAt: new Date().toISOString(),
  };
  all[connectorId] = entry;
  saveAll(all);
  return entry;
}

/** Gibt den Klartext-Key zurück (für IPC-Calls). */
export function getApiKey(connectorId: string): string {
  const all = loadAll();
  return all[connectorId] ? decode(all[connectorId].encoded) : '';
}

/** Gibt den gespeicherten Eintrag (ohne Klartext) zurück. */
export function getStoredKey(connectorId: string): StoredKey | null {
  const all = loadAll();
  return all[connectorId] || null;
}

/** Gibt alle gespeicherten Einträge zurück. */
export function getAllStoredKeys(): Record<string, StoredKey> {
  return loadAll();
}

/** Löscht den Key eines Konnektors. */
export function deleteApiKey(connectorId: string): void {
  const all = loadAll();
  delete all[connectorId];
  saveAll(all);
}

/** Prüft ob ein Key für einen Konnektor gespeichert ist. */
export function hasApiKey(connectorId: string): boolean {
  const all = loadAll();
  return !!all[connectorId];
}

// ── React Hook ────────────────────────────────────────────────

import { useState, useCallback } from 'react';

export function useApiKeys() {
  const [keys, setKeys] = useState<Record<string, StoredKey>>(() => loadAll());

  const refresh = useCallback(() => {
    setKeys(loadAll());
  }, []);

  const save = useCallback((connectorId: string, rawKey: string) => {
    const entry = saveApiKey(connectorId, rawKey);
    setKeys((prev) => ({ ...prev, [connectorId]: entry }));
    return entry;
  }, []);

  const remove = useCallback((connectorId: string) => {
    deleteApiKey(connectorId);
    setKeys((prev) => {
      const next = { ...prev };
      delete next[connectorId];
      return next;
    });
  }, []);

  const get = useCallback((connectorId: string) => {
    return getApiKey(connectorId);
  }, []);

  const has = useCallback((connectorId: string) => {
    return !!keys[connectorId];
  }, [keys]);

  return { keys, save, remove, get, has, refresh };
}
