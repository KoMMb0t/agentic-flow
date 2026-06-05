import { create } from 'zustand';

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  category: string;
  rating: number;
  downloads: number;
  installed: boolean;
  compatibleAgents: string[];
  assignedAgents: string[];
}

interface SkillStore {
  skills: Skill[];
  searchQuery: string;
  selectedCategory: string;
  installSkill: (skillId: string) => void;
  uninstallSkill: (skillId: string) => void;
  assignToAgent: (skillId: string, agentId: string) => void;
  removeFromAgent: (skillId: string, agentId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  getFilteredSkills: () => Skill[];
  getCategories: () => string[];
}

const defaultSkills: Skill[] = [
  {
    id: 'skill-code-review',
    name: 'Code Review Automation',
    version: '2.1.0',
    description: 'Automatische Code-Reviews mit Qualitätsmetriken und Verbesserungsvorschlägen',
    author: 'AgentFlow Community',
    tags: ['code', 'review', 'quality'],
    category: 'Entwicklung',
    rating: 4.8,
    downloads: 12500,
    installed: true,
    compatibleAgents: ['claude-code', 'github-copilot', 'manus', 'deepseek'],
    assignedAgents: ['claude-code'],
  },
  {
    id: 'skill-doc-gen',
    name: 'Documentation Generator',
    version: '1.5.2',
    description: 'Generiert technische Dokumentation aus Code und Kommentaren',
    author: 'DocBot Team',
    tags: ['documentation', 'markdown', 'api'],
    category: 'Dokumentation',
    rating: 4.5,
    downloads: 8900,
    installed: true,
    compatibleAgents: ['claude', 'manus', 'chatgpt'],
    assignedAgents: ['manus'],
  },
  {
    id: 'skill-test-gen',
    name: 'Test Generator',
    version: '3.0.1',
    description: 'Erstellt Unit- und Integrationstests basierend auf Code-Analyse',
    author: 'TestCraft',
    tags: ['testing', 'unit-test', 'integration'],
    category: 'Entwicklung',
    rating: 4.7,
    downloads: 15200,
    installed: false,
    compatibleAgents: ['claude-code', 'github-copilot', 'deepseek'],
    assignedAgents: [],
  },
  {
    id: 'skill-data-viz',
    name: 'Data Visualization',
    version: '1.2.0',
    description: 'Erstellt interaktive Datenvisualisierungen und Dashboards',
    author: 'VizMaster',
    tags: ['data', 'charts', 'visualization'],
    category: 'Analyse',
    rating: 4.3,
    downloads: 6700,
    installed: false,
    compatibleAgents: ['gemini', 'chatgpt', 'claude'],
    assignedAgents: [],
  },
  {
    id: 'skill-security-audit',
    name: 'Security Audit',
    version: '2.0.0',
    description: 'Sicherheitsanalyse von Code und Infrastruktur nach OWASP-Standards',
    author: 'SecureFlow',
    tags: ['security', 'audit', 'owasp'],
    category: 'Sicherheit',
    rating: 4.9,
    downloads: 21000,
    installed: true,
    compatibleAgents: ['openclaw', 'manus', 'claude-code'],
    assignedAgents: ['openclaw'],
  },
  {
    id: 'skill-translation',
    name: 'Multi-Language Translation',
    version: '1.8.0',
    description: 'Übersetzung von Dokumenten und Code-Kommentaren in 40+ Sprachen',
    author: 'LinguaAI',
    tags: ['translation', 'i18n', 'multilingual'],
    category: 'Sprache',
    rating: 4.4,
    downloads: 9800,
    installed: false,
    compatibleAgents: ['mistral', 'le-chat', 'gemini', 'chatgpt'],
    assignedAgents: [],
  },
  {
    id: 'skill-research',
    name: 'Deep Research',
    version: '2.3.0',
    description: 'Tiefgehende Recherche mit Quellenvalidierung und Zusammenfassung',
    author: 'ResearchBot',
    tags: ['research', 'sources', 'analysis'],
    category: 'Recherche',
    rating: 4.6,
    downloads: 11200,
    installed: true,
    compatibleAgents: ['perplexity', 'manus', 'claude', 'gemini'],
    assignedAgents: ['perplexity'],
  },
  {
    id: 'skill-project-planning',
    name: 'Project Planner',
    version: '1.1.0',
    description: 'Erstellt Projektpläne, Meilensteine und Zeitschätzungen',
    author: 'PlannerPro',
    tags: ['planning', 'project', 'agile'],
    category: 'Projektmanagement',
    rating: 4.2,
    downloads: 5400,
    installed: false,
    compatibleAgents: ['jarvis', 'manus', 'chatgpt'],
    assignedAgents: [],
  },
  {
    id: 'skill-api-integration',
    name: 'API Integration Builder',
    version: '1.4.0',
    description: 'Generiert API-Clients und Integrationen aus OpenAPI/Swagger-Specs',
    author: 'APIForge',
    tags: ['api', 'integration', 'openapi'],
    category: 'Entwicklung',
    rating: 4.5,
    downloads: 7800,
    installed: false,
    compatibleAgents: ['claude-code', 'manus', 'github-copilot'],
    assignedAgents: [],
  },
  {
    id: 'skill-prompt-optimizer',
    name: 'Prompt Optimizer',
    version: '2.0.0',
    description: 'Optimiert Prompts für maximale Effektivität bei verschiedenen LLMs',
    author: 'PromptLab',
    tags: ['prompt', 'optimization', 'llm'],
    category: 'KI-Tools',
    rating: 4.7,
    downloads: 18500,
    installed: true,
    compatibleAgents: ['manus', 'claude', 'chatgpt', 'gemini'],
    assignedAgents: ['manus'],
  },
];

export const useSkillStore = create<SkillStore>((set, get) => ({
  skills: defaultSkills,
  searchQuery: '',
  selectedCategory: 'Alle',

  installSkill: (skillId) => {
    set({
      skills: get().skills.map(s =>
        s.id === skillId ? { ...s, installed: true } : s
      ),
    });
  },

  uninstallSkill: (skillId) => {
    set({
      skills: get().skills.map(s =>
        s.id === skillId ? { ...s, installed: false, assignedAgents: [] } : s
      ),
    });
  },

  assignToAgent: (skillId, agentId) => {
    set({
      skills: get().skills.map(s =>
        s.id === skillId && !s.assignedAgents.includes(agentId)
          ? { ...s, assignedAgents: [...s.assignedAgents, agentId] }
          : s
      ),
    });
  },

  removeFromAgent: (skillId, agentId) => {
    set({
      skills: get().skills.map(s =>
        s.id === skillId
          ? { ...s, assignedAgents: s.assignedAgents.filter(a => a !== agentId) }
          : s
      ),
    });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  getFilteredSkills: () => {
    const { skills, searchQuery, selectedCategory } = get();
    return skills.filter(s => {
      const matchesSearch = searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'Alle' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  },

  getCategories: () => {
    const categories = [...new Set(get().skills.map(s => s.category))];
    return ['Alle', ...categories.sort()];
  },
}));
