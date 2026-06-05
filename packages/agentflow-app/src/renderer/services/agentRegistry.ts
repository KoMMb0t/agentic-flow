import type { Agent } from '../types';

export const defaultAgents: Agent[] = [
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic Claude - Hauptassistent für Analyse, Code und kreative Aufgaben',
    avatar: '🧠',
    color: '#6366f1',
    status: 'online',
    capabilities: [
      { name: 'analysis', description: 'Textanalyse & Zusammenfassung' },
      { name: 'coding', description: 'Code-Generierung & Review' },
      { name: 'creative', description: 'Kreatives Schreiben' },
      { name: 'reasoning', description: 'Logisches Denken' },
    ],
    config: {
      apiKey: '',
      endpoint: 'https://api.anthropic.com/v1',
      model: 'claude-sonnet-4-20250514',
    },
    isReal: true,
  },
  {
    id: 'gpt4',
    name: 'GPT-4',
    description: 'OpenAI GPT-4 - Vielseitiger Assistent',
    avatar: '🤖',
    color: '#10b981',
    status: 'not_configured',
    capabilities: [
      { name: 'analysis', description: 'Datenanalyse' },
      { name: 'coding', description: 'Code-Generierung' },
      { name: 'creative', description: 'Kreatives Schreiben' },
    ],
    config: {
      apiKey: '',
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4-turbo',
    },
    isReal: false,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google Gemini - Multimodaler Assistent',
    avatar: '💎',
    color: '#f59e0b',
    status: 'not_configured',
    capabilities: [
      { name: 'multimodal', description: 'Bild- & Textverarbeitung' },
      { name: 'analysis', description: 'Datenanalyse' },
      { name: 'search', description: 'Web-Recherche' },
    ],
    config: {
      apiKey: '',
      endpoint: 'https://generativelanguage.googleapis.com/v1',
      model: 'gemini-pro',
    },
    isReal: false,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral AI - Effizienter europäischer Assistent',
    avatar: '🌊',
    color: '#3b82f6',
    status: 'not_configured',
    capabilities: [
      { name: 'coding', description: 'Code-Generierung' },
      { name: 'analysis', description: 'Textanalyse' },
      { name: 'multilingual', description: 'Mehrsprachig' },
    ],
    config: {
      apiKey: '',
      endpoint: 'https://api.mistral.ai/v1',
      model: 'mistral-large-latest',
    },
    isReal: false,
  },
  {
    id: 'llama',
    name: 'Llama 3',
    description: 'Meta Llama 3 - Open-Source Modell',
    avatar: '🦙',
    color: '#8b5cf6',
    status: 'not_configured',
    capabilities: [
      { name: 'coding', description: 'Code-Generierung' },
      { name: 'analysis', description: 'Textanalyse' },
    ],
    config: {
      apiKey: '',
      endpoint: 'http://localhost:11434',
      model: 'llama3',
    },
    isReal: false,
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    description: 'AgentFlow Orchestrator - Koordiniert alle Agenten',
    avatar: '🎯',
    color: '#ec4899',
    status: 'online',
    capabilities: [
      { name: 'routing', description: 'Message Routing' },
      { name: 'orchestration', description: 'Workflow-Koordination' },
      { name: 'monitoring', description: 'Agent-Monitoring' },
    ],
    config: {
      apiKey: '',
      endpoint: 'local',
      model: 'orchestrator-v1',
    },
    isReal: false,
  },
];

export function getSimulatedResponse(agent: Agent, userMessage: string): string {
  const responses: Record<string, string[]> = {
    gpt4: [
      `[GPT-4 Simulation] Ich würde auf "${userMessage.slice(0, 50)}..." antworten, aber meine API ist nicht verbunden.`,
      `[GPT-4 Simulation] API nicht konfiguriert. Bitte fügen Sie einen OpenAI API-Key in den Einstellungen hinzu.`,
    ],
    gemini: [
      `[Gemini Simulation] Multimodale Analyse von "${userMessage.slice(0, 50)}..." - API nicht verbunden.`,
      `[Gemini Simulation] Google AI API nicht konfiguriert. Bitte Gemini API-Key eintragen.`,
    ],
    mistral: [
      `[Mistral Simulation] Effiziente Verarbeitung von "${userMessage.slice(0, 50)}..." - API nicht verbunden.`,
      `[Mistral Simulation] Mistral API nicht konfiguriert. Endpoint und Key benötigt.`,
    ],
    llama: [
      `[Llama 3 Simulation] Open-Source Analyse von "${userMessage.slice(0, 50)}..." - API nicht verbunden.`,
      `[Llama 3 Simulation] Kein lokaler oder Remote-Endpoint konfiguriert.`,
    ],
    orchestrator: [
      `[Orchestrator] Routing-Anfrage empfangen. Nachricht "${userMessage.slice(0, 30)}..." wird an verfügbare Agenten weitergeleitet.`,
      `[Orchestrator] Workflow-Status: Claude (online), GPT-4 (nicht konfiguriert), Gemini (nicht konfiguriert).`,
    ],
  };

  const agentResponses = responses[agent.id] || [`[${agent.name}] API nicht verbunden. Simulierte Antwort.`];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}
