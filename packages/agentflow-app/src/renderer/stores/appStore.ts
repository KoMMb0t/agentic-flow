import { create } from 'zustand';
import type {
  Agent, AgentStatus, ChatMessage, ChatSession, WindowLayer,
  ViewType, PyramidLayer, Task, TaskStatus, Skill, Connector,
  PromptTemplate, Notification,
} from '../types';
import { defaultAgents } from '../services/agentRegistry';

interface AppState {
  // ============================================================
  // Navigation
  // ============================================================
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // ============================================================
  // Agent Registry
  // ============================================================
  agents: Agent[];
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  updateAgentConfig: (agentId: string, config: Partial<Agent['config']>) => void;

  // ============================================================
  // Chat Sessions (Multi-Agent)
  // ============================================================
  sessions: ChatSession[];
  activeSessionId: string | null;
  createSession: (name: string, agentIds: string[]) => string;
  setActiveSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // ============================================================
  // Pyramid Layers (Inverted Pyramid UI)
  // ============================================================
  layers: PyramidLayer[];
  addLayer: (title: string, component: string) => void;
  removeLayer: (id: string) => void;
  minimizeAll: () => void;
  restoreAll: () => void;
  toggleLayer: (id: string) => void;

  // ============================================================
  // Tasks
  // ============================================================
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;

  // ============================================================
  // Skills
  // ============================================================
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  installSkill: (id: string) => void;
  uninstallSkill: (id: string) => void;

  // ============================================================
  // Connectors
  // ============================================================
  connectors: Connector[];
  setConnectors: (connectors: Connector[]) => void;
  updateConnectorStatus: (id: string, status: Connector['status']) => void;
  toggleConnector: (id: string) => void;

  // ============================================================
  // Prompt Templates
  // ============================================================
  selectedTemplate: PromptTemplate | null;
  setSelectedTemplate: (template: PromptTemplate | null) => void;

  // ============================================================
  // Notifications
  // ============================================================
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;

  // ============================================================
  // Loading
  // ============================================================
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  activeView: 'chat',
  setActiveView: (view) => set({ activeView: view }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Agent Registry
  agents: defaultAgents,
  updateAgentStatus: (agentId, status) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === agentId ? { ...a, status } : a)),
    })),
  updateAgentConfig: (agentId, config) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, config: { ...a.config, ...config } } : a
      ),
    })),

  // Chat Sessions
  sessions: [],
  activeSessionId: null,
  createSession: (name, agentIds) => {
    const id = crypto.randomUUID();
    const session: ChatSession = {
      id,
      name,
      agentIds,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: id,
    }));
    return id;
  },
  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
  addMessage: (sessionId, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [
                ...s.messages,
                { ...message, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            }
          : s
      ),
    })),

  // Pyramid Layers
  layers: [],
  addLayer: (title, component) => {
    const layers = get().layers;
    const newLayer: PyramidLayer = {
      id: crypto.randomUUID(),
      title,
      component,
      minimized: false,
      zIndex: layers.length + 1,
    };
    set({ layers: [...layers, newLayer] });
  },
  removeLayer: (id) => set({ layers: get().layers.filter((l) => l.id !== id) }),
  minimizeAll: () => set({ layers: get().layers.map((l) => ({ ...l, minimized: true })) }),
  restoreAll: () => set({ layers: get().layers.map((l) => ({ ...l, minimized: false })) }),
  toggleLayer: (id) =>
    set({
      layers: get().layers.map((l) => (l.id === id ? { ...l, minimized: !l.minimized } : l)),
    }),

  // Tasks
  tasks: [],
  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ tasks: [...get().tasks, newTask] });
  },
  updateTask: (id, updates) =>
    set({
      tasks: get().tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }),
  deleteTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),
  updateTaskStatus: (id, status) =>
    set({
      tasks: get().tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    }),

  // Skills
  skills: [],
  setSkills: (skills) => set({ skills }),
  installSkill: (id) =>
    set({ skills: get().skills.map((s) => (s.id === id ? { ...s, installed: true } : s)) }),
  uninstallSkill: (id) =>
    set({ skills: get().skills.map((s) => (s.id === id ? { ...s, installed: false } : s)) }),

  // Connectors
  connectors: [],
  setConnectors: (connectors) => set({ connectors }),
  updateConnectorStatus: (id, status) =>
    set({ connectors: get().connectors.map((c) => (c.id === id ? { ...c, status } : c)) }),
  toggleConnector: (id) =>
    set({ connectors: get().connectors.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)) }),

  // Prompt Templates
  selectedTemplate: null,
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const newNotif: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set({ notifications: [...get().notifications, newNotif] });
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set({ notifications: get().notifications.filter((n) => n.id !== newNotif.id) });
    }, 5000);
  },
  removeNotification: (id) =>
    set({ notifications: get().notifications.filter((n) => n.id !== id) }),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
