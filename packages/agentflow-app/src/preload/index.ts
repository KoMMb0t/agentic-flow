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

  // Connector Ping
  pingConnector: (connectorId: string) => ipcRenderer.invoke('connector:ping', connectorId),
});
