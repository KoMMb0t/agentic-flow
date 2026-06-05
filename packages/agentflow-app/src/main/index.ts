import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a1a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // In development, load from Vite dev server
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// Window Controls
// ============================================================
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());

// ============================================================
// Environment Variables (safe subset only)
// ============================================================
ipcMain.handle('env:get', (_event, key: string) => {
  const allowedKeys = ['ANTHROPIC_MODEL', 'GITHUB_USERNAME'];
  if (allowedKeys.includes(key)) {
    return process.env[key] || '';
  }
  return '';
});

// ============================================================
// Claude / Anthropic API (IPC Security - tokens stay in main process)
// ============================================================
ipcMain.handle('anthropic:chat', async (_event, messages: Array<{ role: string; content: string }>, systemPrompt?: string) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

  if (!apiKey) {
    return { error: 'ANTHROPIC_API_KEY nicht konfiguriert. Bitte .env prüfen.' };
  }

  try {
    const body: any = {
      model,
      max_tokens: 4096,
      messages,
    };
    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API Error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
});

// ============================================================
// GitHub API
// ============================================================
ipcMain.handle('github:request', async (_event, endpoint: string, method: string = 'GET', body?: any) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { error: 'GITHUB_TOKEN nicht konfiguriert' };
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'AgentFlow-Desktop/2.0',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `GitHub API Error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
});

// ============================================================
// GitLab API
// ============================================================
ipcMain.handle('gitlab:request', async (_event, endpoint: string, method: string = 'GET') => {
  const token = process.env.GITLAB_TOKEN;
  if (!token) {
    return { error: 'GITLAB_TOKEN nicht konfiguriert' };
  }

  try {
    const response = await fetch(`https://gitlab.com/api/v4${endpoint}`, {
      method,
      headers: {
        'PRIVATE-TOKEN': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `GitLab API Error ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return { error: err.message || 'Unbekannter Fehler' };
  }
});

// ============================================================
// Skills Registry (read/write JSON)
// ============================================================
ipcMain.handle('skills:read', async () => {
  try {
    const dataPath = path.join(__dirname, '../../data/skills-registry.json');
    const content = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(content);
  } catch (err: any) {
    return { version: '1.0.0', lastUpdated: new Date().toISOString(), skills: [] };
  }
});

ipcMain.handle('skills:write', async (_event, data: string) => {
  try {
    const dataPath = path.join(__dirname, '../../data/skills-registry.json');
    fs.writeFileSync(dataPath, data, 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// ============================================================
// Connectors (read/write JSON)
// ============================================================
ipcMain.handle('connectors:read', async () => {
  try {
    const dataPath = path.join(__dirname, '../../data/connectors.json');
    const content = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(content);
  } catch (err: any) {
    return { connectors: [] };
  }
});

ipcMain.handle('connectors:write', async (_event, data: string) => {
  try {
    const dataPath = path.join(__dirname, '../../data/connectors.json');
    fs.writeFileSync(dataPath, data, 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// ============================================================
// Connector Ping
// ============================================================
ipcMain.handle('connector:ping', async (_event, connectorId: string) => {
  try {
    let url: string;
    let headers: Record<string, string> = {};

    switch (connectorId) {
      case 'github':
        url = 'https://api.github.com/user';
        headers = {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN || ''}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'AgentFlow-Desktop/2.0',
        };
        break;
      case 'gitlab':
        url = 'https://gitlab.com/api/v4/user';
        headers = {
          'PRIVATE-TOKEN': process.env.GITLAB_TOKEN || '',
        };
        break;
      case 'anthropic': {
        const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
        const start = Date.now();
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        const latency = Date.now() - start;
        return {
          status: anthropicResponse.ok ? 'online' : 'error',
          latency,
          message: anthropicResponse.ok ? 'Verbunden' : `Fehler: ${anthropicResponse.status}`,
        };
      }
      case 'slack':
        return { status: 'offline', latency: 0, message: 'Slack-Token nicht konfiguriert' };
      case 'openai':
        return { status: 'offline', latency: 0, message: 'OpenAI-Token nicht konfiguriert' };
      default:
        return { status: 'error', latency: 0, message: 'Unbekannter Konnektor' };
    }

    const start = Date.now();
    const response = await fetch(url, { method: 'GET', headers });
    const latency = Date.now() - start;

    return {
      status: response.ok ? 'online' : 'error',
      latency,
      message: response.ok ? 'Verbunden' : `Fehler: ${response.status}`,
      data: response.ok ? await response.json() : null,
    };
  } catch (error: any) {
    return {
      status: 'offline',
      latency: 0,
      message: error.message || 'Verbindung fehlgeschlagen',
    };
  }
});

// ============================================================
// App Lifecycle
// ============================================================
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
