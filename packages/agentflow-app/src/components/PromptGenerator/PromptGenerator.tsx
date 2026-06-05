import React, { useState } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { Wand2, Copy, Send, FileText, ChevronDown, History } from 'lucide-react';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  variables: string[];
}

const templates: PromptTemplate[] = [
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Analysiere Code und gib Verbesserungsvorschläge',
    template: 'Analysiere den folgenden {{sprache}}-Code und gib detaillierte Verbesserungsvorschläge bezüglich {{fokus}}:\n\n```{{sprache}}\n{{code}}\n```',
    category: 'Entwicklung',
    variables: ['sprache', 'fokus', 'code'],
  },
  {
    id: 'documentation',
    name: 'Dokumentation erstellen',
    description: 'Generiere technische Dokumentation',
    template: 'Erstelle eine umfassende technische Dokumentation für {{projekt}} mit Fokus auf {{bereich}}. Die Dokumentation soll {{format}}-Format verwenden und folgende Aspekte abdecken: Architektur, API-Referenz, Beispiele.',
    category: 'Dokumentation',
    variables: ['projekt', 'bereich', 'format'],
  },
  {
    id: 'bug-analysis',
    name: 'Bug-Analyse',
    description: 'Analysiere einen Bug und schlage Fixes vor',
    template: 'Analysiere den folgenden Fehler in {{komponente}}:\n\nFehlerbeschreibung: {{beschreibung}}\nErwartetes Verhalten: {{erwartet}}\nTatsächliches Verhalten: {{tatsaechlich}}\n\nSchlage mögliche Ursachen und Lösungen vor.',
    category: 'Entwicklung',
    variables: ['komponente', 'beschreibung', 'erwartet', 'tatsaechlich'],
  },
  {
    id: 'research',
    name: 'Recherche-Auftrag',
    description: 'Tiefgehende Recherche zu einem Thema',
    template: 'Führe eine umfassende Recherche zum Thema "{{thema}}" durch. Berücksichtige dabei:\n- Aktuelle Entwicklungen ({{zeitraum}})\n- Vor- und Nachteile\n- Vergleich mit Alternativen: {{alternativen}}\n- Praxisbeispiele und Best Practices',
    category: 'Recherche',
    variables: ['thema', 'zeitraum', 'alternativen'],
  },
  {
    id: 'task-planning',
    name: 'Aufgabenplanung',
    description: 'Erstelle einen strukturierten Aufgabenplan',
    template: 'Erstelle einen detaillierten Aufgabenplan für: {{aufgabe}}\n\nRahmenbedingungen:\n- Zeitrahmen: {{zeitrahmen}}\n- Team-Größe: {{team}}\n- Priorität: {{prioritaet}}\n\nBerücksichtige Abhängigkeiten, Risiken und Meilensteine.',
    category: 'Projektmanagement',
    variables: ['aufgabe', 'zeitrahmen', 'team', 'prioritaet'],
  },
  {
    id: 'api-design',
    name: 'API-Design',
    description: 'Entwirf eine REST/GraphQL API',
    template: 'Entwirf eine {{api_typ}} API für {{service}}:\n\nAnforderungen:\n{{anforderungen}}\n\nBerücksichtige: Authentifizierung, Versionierung, Fehlerbehandlung, Rate-Limiting und OpenAPI-Spezifikation.',
    category: 'Entwicklung',
    variables: ['api_typ', 'service', 'anforderungen'],
  },
];

export const PromptGenerator: React.FC = () => {
  const { agents, selectedAgentId, sendMessage, selectAgent } = useAgentStore();
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setVariables({});
    setGeneratedPrompt('');
  };

  const generatePrompt = () => {
    if (!selectedTemplate) {
      setGeneratedPrompt(customPrompt);
      if (customPrompt) setHistory(prev => [customPrompt, ...prev.slice(0, 9)]);
      return;
    }

    let result = selectedTemplate.template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
    }
    setGeneratedPrompt(result);
    setHistory(prev => [result, ...prev.slice(0, 9)]);
  };

  const sendToAgent = () => {
    if (!generatedPrompt || !selectedAgentId) return;
    sendMessage(generatedPrompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-af-text">Prompt-Generator</h2>
          <p className="text-xs text-af-text-muted">Erstelle optimierte Prompts für deine Agenten</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="af-button-secondary text-xs flex items-center gap-1.5"
        >
          <History size={12} />
          History ({history.length})
        </button>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="af-card mb-4 max-h-40 overflow-y-auto animate-slide-down">
          <h3 className="text-xs font-semibold text-af-text-muted mb-2">Letzte Prompts</h3>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => { setGeneratedPrompt(h); setShowHistory(false); }}
              className="w-full text-left text-xs text-af-text-muted p-2 hover:bg-af-surface-light rounded truncate"
            >
              {h.substring(0, 100)}...
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Left: Template Selection */}
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-sm font-semibold text-af-text mb-2">Vorlagen</h3>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'bg-af-primary/10 border border-af-primary/30'
                    : 'bg-af-dark hover:bg-af-surface-light border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={12} className="text-af-primary" />
                  <span className="text-xs font-medium text-af-text">{template.name}</span>
                </div>
                <p className="text-[10px] text-af-text-muted mt-1">{template.description}</p>
                <span className="text-[10px] px-1.5 py-0.5 bg-af-surface-light rounded mt-1 inline-block">
                  {template.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Variables + Output */}
        <div className="flex flex-col overflow-hidden">
          {selectedTemplate ? (
            <>
              <h3 className="text-sm font-semibold text-af-text mb-2">
                Variablen: {selectedTemplate.name}
              </h3>
              <div className="space-y-2 mb-3 overflow-y-auto">
                {selectedTemplate.variables.map((v) => (
                  <div key={v}>
                    <label className="text-[10px] text-af-text-muted uppercase tracking-wider">{v}</label>
                    <input
                      type="text"
                      placeholder={`{{${v}}}`}
                      value={variables[v] || ''}
                      onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                      className="af-input text-sm mt-0.5"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-af-text mb-2">Freier Prompt</h3>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Schreibe deinen Prompt hier..."
                className="af-input text-sm flex-1 resize-none mb-3"
              />
            </>
          )}

          {/* Generate Button */}
          <button
            onClick={generatePrompt}
            className="af-button-primary text-sm flex items-center justify-center gap-2 mb-3"
          >
            <Wand2 size={14} />
            Prompt generieren
          </button>

          {/* Generated Output */}
          {generatedPrompt && (
            <div className="af-card flex-1 overflow-y-auto animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-af-text">Generierter Prompt</span>
                <div className="flex gap-1">
                  <button onClick={copyToClipboard} className="p-1 rounded hover:bg-af-surface-light text-af-text-muted" title="Kopieren">
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={sendToAgent}
                    disabled={!selectedAgentId}
                    className="p-1 rounded hover:bg-af-primary/20 text-af-primary disabled:opacity-50"
                    title="An Agent senden"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
              <pre className="text-xs text-af-text-muted whitespace-pre-wrap font-mono">
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Agent Target Selector */}
      <div className="mt-3 pt-3 border-t border-af-border flex items-center gap-3">
        <span className="text-xs text-af-text-muted">Senden an:</span>
        <select
          value={selectedAgentId || ''}
          onChange={(e) => selectAgent(e.target.value)}
          className="af-input text-xs w-48"
        >
          <option value="">Agent wählen...</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PromptGenerator;
