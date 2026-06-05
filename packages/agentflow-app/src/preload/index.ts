import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Environment
  getEnv: (key: string) => ipcRenderer.invoke('env:get', key),

  // Claude / Anthropic
  chatWithClaude: (messages: Array<{ role: string; content: string }>, systemPrompt?: string) =>
    ipcRenderer.invoke('anthropic:chat', messages, systemPrompt),

  // GitHub
  githubRequest: (endpoint: string, method?: string, body?: any) =>
    ipcRenderer.invoke('github:request', endpoint, method, body),

  // GitLab
  gitlabRequest: (endpoint: string, method?: string) =>
    ipcRenderer.invoke('gitlab:request', endpoint, method),

  // Skills
  readSkills: () => ipcRenderer.invoke('skills:read'),
  writeSkills: (data: string) => ipcRenderer.invoke('skills:write', data),

  // Connectors
  readConnectors: () => ipcRenderer.invoke('connectors:read'),
  writeConnectors: (data: string) => ipcRenderer.invoke('connectors:write', data),

  // Connector Ping (uses .env token)
  pingConnector: (connectorId: string) => ipcRenderer.invoke('connector:ping', connectorId),

  // Connector Ping with explicit UI-entered key
  pingConnectorWithKey: (connectorId: string, apiKey: string) =>
    ipcRenderer.invoke('connector:ping-with-key', connectorId, apiKey),

  // App Update
  checkUpdate: (githubToken?: string) => ipcRenderer.invoke('app:check-update', githubToken),
  doUpdate: (githubToken?: string) => ipcRenderer.invoke('app:do-update', githubToken),
});
