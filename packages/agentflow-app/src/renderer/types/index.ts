// ============================================================
// AgentFlow JSON Protocol (AFJP) v1.0
// ============================================================
export type SenderType = 'agent' | 'user';
export type ReceiverType = 'agent' | 'user' | 'broadcast';
export type MessageType = 'request' | 'response' | 'notification';
export type MessageFormat = 'text' | 'markdown' | 'code' | 'json';
export type Priority = 'low' | 'medium' | 'high';
export type AgentStatus = 'online' | 'offline' | 'not_configured';

export interface AFJPSender {
  type: SenderType;
  id: string;
  name: string;
}

export interface AFJPReceiver {
  type: ReceiverType;
  id: string;
  name: string;
}

export interface AFJPMessageContent {
  type: MessageType;
  content: string;
  format: MessageFormat;
  metadata: {
    priority: Priority;
    tags: string[];
    skill_required: string;
  };
}

export interface AFJPRouting {
  via: string[];
  fallback: string[];
  timeout_ms: number;
}

export interface AFJPMessage {
  version: string;
  id: string;
  timestamp: string;
  sender: AFJPSender;
  receiver: AFJPReceiver;
  message: AFJPMessageContent;
  routing: AFJPRouting;
}

// ============================================================
// Agent Registry Types
// ============================================================
export interface AgentCapability {
  name: string;
  description: string;
}

export interface AgentConfig {
  apiKey: string;
  endpoint: string;
  model: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  status: AgentStatus;
  capabilities: AgentCapability[];
  config: AgentConfig;
  isReal: boolean;
}

// ============================================================
// Chat Types
// ============================================================
export interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  format: MessageFormat;
  timestamp: string;
  isUser: boolean;
  isSimulated: boolean;
  afjpMessage?: AFJPMessage;
}

export interface ChatSession {
  id: string;
  name: string;
  agentIds: string[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// GitHub Types
// ============================================================
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  topics: string[];
  visibility: string;
  default_branch: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: { name: string; color: string }[];
  repository_url: string;
  user: { login: string; avatar_url: string };
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: { login: string; avatar_url: string };
  head: { ref: string };
  base: { ref: string };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  html_url: string;
  author: { login: string; avatar_url: string } | null;
}

export interface GitHubContributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

// ============================================================
// Task Types
// ============================================================
export type TaskStatus = 'open' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgent: string | null;
  githubIssueNumber: number | null;
  githubRepo: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Skill Types
// ============================================================
export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  category: string;
  icon: string;
  compatibility: string[];
  installed: boolean;
  config: Record<string, any>;
}

export interface SkillsRegistry {
  version: string;
  lastUpdated: string;
  skills: Skill[];
}

// ============================================================
// Connector Types
// ============================================================
export interface Connector {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  baseUrl: string;
  enabled: boolean;
  status: 'online' | 'offline' | 'error' | 'unknown';
  config: Record<string, any>;
}

export interface ConnectorsData {
  connectors: Connector[];
}

export interface PingResult {
  status: 'online' | 'offline' | 'error';
  latency: number;
  message: string;
  data?: any;
}

// ============================================================
// Prompt Template Types
// ============================================================
export interface PromptTemplate {
  id: string;
  name: string;
  category: 'code' | 'kreativ' | 'analyse' | 'planung';
  description: string;
  template: string;
  variables: string[];
  icon: string;
}

// ============================================================
// UI Types (Inverted Pyramid)
// ============================================================
export interface PyramidLayer {
  id: string;
  title: string;
  component: string;
  minimized: boolean;
  zIndex: number;
}

export interface WindowLayer {
  id: string;
  title: string;
  component: string;
  zIndex: number;
  isMinimized: boolean;
  isActive: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// ============================================================
// Navigation
// ============================================================
export type ViewType = 'chat' | 'registry' | 'router' | 'dashboard' | 'docs' | 'tasks' | 'skills' | 'prompts' | 'connectors' | 'settings';

// ============================================================
// Notification
// ============================================================
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
}

// ============================================================
// Electron API Bridge
// ============================================================
export interface UpdateCheckResult {
  localSha?: string;
  localDate?: string;
  localMessage?: string;
  remoteSha?: string;
  remoteDate?: string;
  remoteMessage?: string;
  remoteAuthor?: string;
  hasUpdate?: boolean;
  isGitRepo?: boolean;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  output?: string;
  newSha?: string;
  newDate?: string;
  newMessage?: string;
  alreadyUpToDate?: boolean;
  error?: string;
}

// ============================================================
export interface ElectronAPI {
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  // Environment
  getEnv: (key: string) => Promise<string>;
  // Claude API
  chatWithClaude: (messages: Array<{ role: string; content: string }>, systemPrompt?: string) => Promise<any>;
  // GitHub API
  githubRequest: (endpoint: string, method?: string, body?: any) => Promise<any>;
  // GitLab API
  gitlabRequest: (endpoint: string, method?: string) => Promise<any>;
  // Skills
  readSkills: () => Promise<SkillsRegistry>;
  writeSkills: (data: string) => Promise<{ success: boolean }>;
  // Connectors
  readConnectors: () => Promise<ConnectorsData>;
  writeConnectors: (data: string) => Promise<{ success: boolean }>;
  // Connector Ping
  pingConnector: (connectorId: string) => Promise<PingResult>;
  // Connector Ping with explicit UI-entered key
  pingConnectorWithKey: (connectorId: string, apiKey: string) => Promise<PingResult>;
  // App Update
  checkUpdate: (githubToken?: string) => Promise<UpdateCheckResult>;
  doUpdate: (githubToken?: string) => Promise<UpdateResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
