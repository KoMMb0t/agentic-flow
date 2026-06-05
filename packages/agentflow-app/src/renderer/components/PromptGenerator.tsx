import React, { useState } from 'react';
import type { PromptTemplate } from '../types';

const TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-review',
    name: 'Code Review',
    category: 'code',
    description: 'Analysiere Code auf Qualität, Bugs und Verbesserungen',
    icon: '🔍',
    template: 'Analysiere den folgenden Code und gib ein detailliertes Review:\n\nSprache: {{language}}\nFokus: {{focus}}\n\nCode:\n```\n{{code}}\n```\n\nBitte prüfe: Bugs, Performance, Best Practices, Security, Lesbarkeit.',
    variables: ['language', 'focus', 'code'],
  },
  {
    id: 'blog-post',
    name: 'Blog-Post',
    category: 'kreativ',
    description: 'Erstelle einen strukturierten Blog-Post',
    icon: '📝',
    template: 'Erstelle einen professionellen Blog-Post zum Thema "{{topic}}". Der Ton sollte {{tone}} sein. Zielgruppe: {{audience}}. Länge: ca. {{length}} Wörter. Inkludiere eine packende Einleitung, strukturierte Abschnitte und ein Fazit.',
    variables: ['topic', 'tone', 'audience', 'length'],
  },
  {
    id: 'data-analysis',
    name: 'Datenanalyse',
    category: 'analyse',
    description: 'Analysiere Daten und erstelle Insights',
    icon: '📊',
    template: 'Analysiere die folgenden Daten und erstelle:\n1. Zusammenfassung der wichtigsten Erkenntnisse\n2. Trends und Muster\n3. Handlungsempfehlungen\n4. Visualisierungsvorschläge\n\nKontext: {{context}}\n\nDaten:\n{{data}}',
    variables: ['context', 'data'],
  },
  {
    id: 'swot-analysis',
    name: 'SWOT-Analyse',
    category: 'analyse',
    description: 'Erstelle eine SWOT-Analyse',
    icon: '📋',
    template: 'Erstelle eine detaillierte SWOT-Analyse für {{subject}} im Kontext von {{market}}. Berücksichtige aktuelle Markttrends und Wettbewerber. Gib für jeden Quadranten mindestens 5 Punkte an.',
    variables: ['subject', 'market'],
  },
  {
    id: 'project-plan',
    name: 'Projektplan',
    category: 'planung',
    description: 'Erstelle einen strukturierten Projektplan',
    icon: '📅',
    template: 'Erstelle einen detaillierten Projektplan für: {{project}}\n\nTeamgröße: {{team_size}}\nZeitraum: {{timeline}}\nMethodik: {{methodology}}\n\nInkludiere: Meilensteine, Aufgabenverteilung, Risiken, Abhängigkeiten und Zeitschätzungen.',
    variables: ['project', 'team_size', 'timeline', 'methodology'],
  },
  {
    id: 'architecture',
    name: 'Architektur-Design',
    category: 'code',
    description: 'Entwerfe eine Software-Architektur',
    icon: '🏗️',
    template: 'Entwerfe eine Software-Architektur für: {{system}}\n\nAnforderungen:\n{{requirements}}\n\nTech-Stack: {{tech_stack}}\nSkalierung: {{scaling}}\n\nInkludiere: Komponenten-Diagramm, Datenfluss, API-Design, Deployment-Strategie.',
    variables: ['system', 'requirements', 'tech_stack', 'scaling'],
  },
  {
    id: 'marketing-copy',
    name: 'Marketing-Text',
    category: 'kreativ',
    description: 'Erstelle überzeugende Marketing-Texte',
    icon: '📣',
    template: 'Erstelle einen überzeugenden Marketing-Text für {{product}}. Zielgruppe: {{audience}}. Kanal: {{channel}}. USPs: {{usps}}. Der Text soll zum Handeln motivieren und die Vorteile klar kommunizieren.',
    variables: ['product', 'audience', 'channel', 'usps'],
  },
  {
    id: 'user-story',
    name: 'User Stories',
    category: 'planung',
    description: 'Generiere User Stories für agile Entwicklung',
    icon: '👤',
    template: 'Generiere User Stories für das Feature: {{feature}}\n\nProdukt: {{product}}\nPersona: {{persona}}\n\nFormat: Als [Rolle] möchte ich [Funktion], damit [Nutzen].\nInkludiere Akzeptanzkriterien und Story Points.',
    variables: ['feature', 'product', 'persona'],
  },
];

const PromptGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = [...new Set(TEMPLATES.map((t) => t.category))];
  const filteredTemplates = categoryFilter
    ? TEMPLATES.filter((t) => t.category === categoryFilter)
    : TEMPLATES;

  function selectTemplate(template: PromptTemplate) {
    setSelectedTemplate(template);
    setVariables({});
    setGeneratedPrompt('');
  }

  function generatePrompt() {
    if (!selectedTemplate) return;
    let prompt = selectedTemplate.template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
    }
    setGeneratedPrompt(prompt);
  }

  function copyPrompt() {
    navigator.clipboard.writeText(generatedPrompt);
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold text-af-text">Prompt-Generator</h2>

      {/* Category Filter */}
      <div className="flex gap-1">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${!categoryFilter ? 'bg-af-accent text-white' : 'text-af-muted hover:bg-af-surface'}`}
        >
          Alle
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-[10px] px-2 py-1 rounded-lg capitalize transition-colors ${categoryFilter === cat ? 'bg-af-accent text-white' : 'text-af-muted hover:bg-af-surface'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates */}
      {!selectedTemplate ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => selectTemplate(template)}
              className="bg-af-surface border border-af-border rounded-xl p-4 text-left hover:border-af-accent/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{template.icon}</span>
                <h3 className="text-sm font-medium text-af-text">{template.name}</h3>
              </div>
              <p className="text-[10px] text-af-muted">{template.description}</p>
              <div className="flex gap-1 mt-2">
                {template.variables.map((v) => (
                  <span key={v} className="text-[9px] bg-af-dark text-af-muted px-1 py-0.5 rounded">{v}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedTemplate(null)} className="text-xs text-af-muted hover:text-af-text">
              ← Zurück
            </button>
            <span className="text-lg">{selectedTemplate.icon}</span>
            <h3 className="text-sm font-medium text-af-text">{selectedTemplate.name}</h3>
          </div>

          {/* Variable Inputs */}
          <div className="bg-af-surface border border-af-border rounded-xl p-4 space-y-3">
            {selectedTemplate.variables.map((variable) => (
              <div key={variable}>
                <label className="text-[10px] text-af-muted uppercase tracking-wider block mb-1">{variable}</label>
                <input
                  value={variables[variable] || ''}
                  onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                  placeholder={`${variable} eingeben...`}
                  className="w-full bg-af-dark border border-af-border rounded-lg px-3 py-1.5 text-xs text-af-text placeholder-af-muted focus:outline-none focus:ring-1 focus:ring-af-accent"
                />
              </div>
            ))}
            <button
              onClick={generatePrompt}
              className="text-xs bg-af-accent hover:bg-af-accent-hover text-white px-4 py-2 rounded-lg transition-colors"
            >
              Prompt generieren
            </button>
          </div>

          {/* Generated Prompt */}
          {generatedPrompt && (
            <div className="bg-af-surface border border-af-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-af-text">Generierter Prompt</h4>
                <button onClick={copyPrompt} className="text-[10px] text-af-accent hover:underline">Kopieren</button>
              </div>
              <pre className="text-xs text-af-text whitespace-pre-wrap bg-af-dark rounded-lg p-3 border border-af-border">
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptGenerator;
