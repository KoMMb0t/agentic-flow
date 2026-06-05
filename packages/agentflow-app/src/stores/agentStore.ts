import { create } from 'zustand';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'online' | 'offline' | 'busy';
  color: string;
  skills: string[];
}

export interface ChatMessage {
  id: string;
  agentId: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  format: 'text' | 'markdown' | 'code';
}

interface AgentStore {
  agents: Agent[];
  selectedAgentId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  selectAgent: (agentId: string) => void;
  sendMessage: (content: string) => void;
  getSelectedAgent: () => Agent | undefined;
  getMessagesForAgent: (agentId: string) => ChatMessage[];
}

const defaultAgents: Agent[] = [
  { id: 'manus', name: 'Manus', description: 'Autonomer General-AI-Agent', icon: '🤖', status: 'online', color: '#6366f1', skills: ['code', 'research', 'automation'] },
  { id: 'monica', name: 'Monica', description: 'AI-Assistentin für Produktivität', icon: '💜', status: 'online', color: '#8b5cf6', skills: ['writing', 'summarization'] },
  { id: 'github-copilot', name: 'GitHub Copilot', description: 'AI-Pair-Programmer', icon: '🐙', status: 'online', color: '#238636', skills: ['code', 'completion'] },
  { id: 'openclaw', name: 'OpenClaw', description: 'Enterprise Multi-Server KI-System', icon: '🦀', status: 'online', color: '#ef4444', skills: ['inference', 'distributed'] },
  { id: 'chatgpt', name: 'ChatGPT', description: 'OpenAI Conversational AI', icon: '💬', status: 'online', color: '#10a37f', skills: ['conversation', 'analysis'] },
  { id: 'gemini', name: 'Gemini', description: 'Google DeepMind Multimodal AI', icon: '✨', status: 'online', color: '#4285f4', skills: ['multimodal', 'reasoning'] },
  { id: 'perplexity', name: 'Perplexity', description: 'AI-Suchmaschine mit Quellen', icon: '🔍', status: 'online', color: '#20b2aa', skills: ['search', 'research'] },
  { id: 'jarvis', name: 'Jarvis', description: 'Persönlicher AI-Assistent', icon: '🎯', status: 'offline', color: '#f59e0b', skills: ['planning', 'scheduling'] },
  { id: 'claude', name: 'Claude', description: 'Anthropic AI-Assistent', icon: '🧠', status: 'online', color: '#d97706', skills: ['analysis', 'writing', 'code'] },
  { id: 'claude-code', name: 'Claude Code', description: 'Claude für Software-Entwicklung', icon: '⌨️', status: 'online', color: '#ea580c', skills: ['code', 'architecture'] },
  { id: 'deepseek', name: 'Deep Seek', description: 'Fortschrittliches Reasoning-Modell', icon: '🌊', status: 'online', color: '#0ea5e9', skills: ['reasoning', 'math', 'code'] },
  { id: 'mistral', name: 'Mistral', description: 'Europäisches Open-Source LLM', icon: '🌬️', status: 'online', color: '#f97316', skills: ['multilingual', 'code'] },
  { id: 'le-chat', name: 'Le Chat', description: 'Mistral AI Conversational Interface', icon: '🐱', status: 'online', color: '#a855f7', skills: ['conversation', 'creative'] },
];

const mockResponses: Record<string, string[]> = {
  'manus': [
    'Ich habe die Aufgabe analysiert und einen Plan erstellt. Soll ich mit der Implementierung beginnen?',
    'Die Recherche ist abgeschlossen. Hier sind die wichtigsten Erkenntnisse...',
    'Ich habe den Code geschrieben und getestet. Alle Tests bestehen.',
  ],
  'claude': [
    'Ich habe das Dokument analysiert. Hier ist meine Zusammenfassung...',
    'Basierend auf meiner Analyse empfehle ich folgenden Ansatz...',
    'Gerne helfe ich bei der Strukturierung. Hier ist ein Vorschlag...',
  ],
  'default': [
    'Nachricht empfangen. Ich verarbeite Ihre Anfrage...',
    'Hier ist meine Antwort auf Ihre Frage. Kann ich noch etwas für Sie tun?',
    'Aufgabe abgeschlossen. Die Ergebnisse sind bereit zur Überprüfung.',
  ],
};

let messageIdCounter = 0;

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: defaultAgents,
  selectedAgentId: null,
  messages: [],
  isLoading: false,

  selectAgent: (agentId) => {
    set({ selectedAgentId: agentId });
  },

  sendMessage: (content) => {
    const { selectedAgentId, messages } = get();
    if (!selectedAgentId) return;

    const userMessage: ChatMessage = {
      id: `msg-${++messageIdCounter}`,
      agentId: selectedAgentId,
      role: 'user',
      content,
      timestamp: new Date(),
      format: 'text',
    };

    set({ messages: [...messages, userMessage], isLoading: true });

    // Simulate agent response
    setTimeout(() => {
      const responses = mockResponses[selectedAgentId] || mockResponses['default'];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const agentMessage: ChatMessage = {
        id: `msg-${++messageIdCounter}`,
        agentId: selectedAgentId,
        role: 'agent',
        content: randomResponse,
        timestamp: new Date(),
        format: 'markdown',
      };

      set((state) => ({
        messages: [...state.messages, agentMessage],
        isLoading: false,
      }));
    }, 1000 + Math.random() * 2000);
  },

  getSelectedAgent: () => {
    const { agents, selectedAgentId } = get();
    return agents.find(a => a.id === selectedAgentId);
  },

  getMessagesForAgent: (agentId) => {
    return get().messages.filter(m => m.agentId === agentId);
  },
}));
