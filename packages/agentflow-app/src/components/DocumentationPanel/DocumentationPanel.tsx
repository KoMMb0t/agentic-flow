import React, { useState } from 'react';
import { FileText, RefreshCw, Download, Eye, Code, BookOpen, Loader2 } from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  content: string;
  type: 'architecture' | 'api' | 'guide' | 'changelog';
  lastUpdated: Date;
}

export const DocumentationPanel: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocSection | null>(null);
  const [docs, setDocs] = useState<DocSection[]>([
    {
      id: 'arch-1',
      title: 'System-Architektur',
      content: `# AgentFlow System-Architektur

## Übersicht
AgentFlow ist ein Multi-Plattform AI-Agent-Orchestrierungssystem, das auf dem Inverted Pyramid UI-Paradigma basiert.

## Kernkomponenten

### 1. LayerManager
Der LayerManager implementiert das Inverted Pyramid UI-Konzept mit einem z-index-basierten Schichtensystem.

\`\`\`typescript
interface Layer {
  id: string;
  title: string;
  componentKey: string;
  zIndex: number;
  minimized: boolean;
}
\`\`\`

### 2. Agent-Orchestrierung
- 13 externe KI-Agenten integriert
- Einheitliches IAC-JSON Kommunikationsprotokoll
- Automatische Routing-Logik

### 3. Konnektor-System
- Plugin-basierte Architektur
- 8 vorkonfigurierte Konnektoren
- Dynamisches Hinzufügen neuer Konnektoren

### 4. Skill-Marktplatz
- Dezentrales Skill-Repository
- Agenten-Zuweisung
- Versionierung und Bewertungssystem`,
      type: 'architecture',
      lastUpdated: new Date(),
    },
    {
      id: 'api-1',
      title: 'API-Referenz',
      content: `# AgentFlow API-Referenz

## IAC-JSON Protocol v1.0

### Nachrichtenformat
\`\`\`json
{
  "version": "1.0",
  "id": "uuid-v4",
  "timestamp": "ISO-8601",
  "sender": { "type": "agent|user|system", "id": "string" },
  "receiver": { "type": "agent|user|broadcast", "id": "string" },
  "message": {
    "type": "request|response|notification",
    "content": "string",
    "format": "text|markdown|code|json"
  }
}
\`\`\`

## Konnektor-API

### BaseConnector Interface
\`\`\`typescript
abstract class BaseConnector {
  abstract authenticate(credentials): Promise<void>;
  abstract sendMessage(payload): Promise<Response>;
  abstract getStatus(): Promise<ConnectorStatus>;
  abstract disconnect(): Promise<void>;
}
\`\`\`

## Skill-API

### Skill-Manifest
Jeder Skill muss eine \`skill.json\` im Root-Verzeichnis enthalten.`,
      type: 'api',
      lastUpdated: new Date(),
    },
    {
      id: 'guide-1',
      title: 'Benutzerhandbuch',
      content: `# AgentFlow Benutzerhandbuch

## Erste Schritte

### 1. Agent auswählen
Klicke auf das Agenten-Panel in der Seitenleiste und wähle einen der verfügbaren Agenten aus.

### 2. Konversation starten
Tippe deine Nachricht in das Eingabefeld und drücke Enter oder klicke auf Senden.

### 3. Inverted Pyramid Navigation
- **Basis-Schicht**: Das Hauptarbeitsfenster ist immer sichtbar
- **Neue Schichten**: Öffne Panels über die Seitenleiste
- **Alles minimieren**: Klicke auf das Pyramiden-Symbol
- **Alles zurück**: Nutze den schwebenden Button unten rechts

### 4. Konnektoren einrichten
Navigiere zum Konnektor-Panel und verbinde deine Plattformen.

### 5. Skills installieren
Durchsuche den Skill-Marktplatz und installiere benötigte Fähigkeiten.`,
      type: 'guide',
      lastUpdated: new Date(),
    },
    {
      id: 'changelog-1',
      title: 'Changelog v1.0.0',
      content: `# Changelog

## v1.0.0 (2026-06-05)

### Neue Features
- Inverted Pyramid UI mit LayerManager
- 13 KI-Agenten integriert (Manus, Claude, ChatGPT, etc.)
- 8 Plattform-Konnektoren
- Skill-Marktplatz mit 10 vorinstallierten Skills
- Prompt-Generator mit Template-System
- Projektstatus-Dashboard
- Automatische Dokumentationserstellung

### Technische Basis
- Electron + React 19 + TypeScript
- TailwindCSS für Styling
- Zustand für State Management
- Vite als Build-Tool

### Bekannte Einschränkungen
- Agenten-Antworten sind Mock-Daten
- Konnektoren sind noch nicht mit echten APIs verbunden
- Skill-Installation ist simuliert`,
      type: 'changelog',
      lastUpdated: new Date(),
    },
  ]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newDoc: DocSection = {
        id: `doc-${Date.now()}`,
        title: `Auto-generierte Doku (${new Date().toLocaleDateString('de-DE')})`,
        content: `# Automatisch generierte Dokumentation

## Projektstatus
- **Aktive Agenten**: 11/13 online
- **Verbundene Plattformen**: 4/8
- **Installierte Skills**: 5/10
- **Sprint-Fortschritt**: 63%

## Letzte Aktivitäten
- Code Review für feat/agent-panel abgeschlossen
- Neuer Skill "Prompt Optimizer" installiert
- Slack-Integration erfolgreich getestet

## Empfehlungen
1. GitLab-Konnektor für CI/CD-Integration aktivieren
2. Security Audit Skill dem OpenClaw-Agenten zuweisen
3. Dokumentation vor Release aktualisieren

*Generiert am ${new Date().toLocaleString('de-DE')} durch AgentFlow Documentation Engine*`,
        type: 'guide',
        lastUpdated: new Date(),
      };
      setDocs(prev => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
      setIsGenerating(false);
    }, 2000);
  };

  const getTypeIcon = (type: DocSection['type']) => {
    switch (type) {
      case 'architecture': return <Code size={14} className="text-af-primary" />;
      case 'api': return <FileText size={14} className="text-af-accent" />;
      case 'guide': return <BookOpen size={14} className="text-green-400" />;
      case 'changelog': return <RefreshCw size={14} className="text-yellow-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-af-text">Dokumentation</h2>
          <p className="text-xs text-af-text-muted">{docs.length} Dokumente verfügbar</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="af-button-primary text-sm flex items-center gap-1.5"
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {isGenerating ? 'Generiere...' : 'Doku erstellen'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Doc List */}
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-xs font-semibold text-af-text-muted mb-2 uppercase tracking-wider">Dokumente</h3>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedDoc?.id === doc.id
                    ? 'bg-af-primary/10 border border-af-primary/30'
                    : 'bg-af-dark hover:bg-af-surface-light border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getTypeIcon(doc.type)}
                  <span className="text-xs font-medium text-af-text truncate">{doc.title}</span>
                </div>
                <p className="text-[10px] text-af-text-muted">
                  {doc.lastUpdated.toLocaleDateString('de-DE')}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Doc Preview */}
        <div className="col-span-2 flex flex-col overflow-hidden">
          {selectedDoc ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-af-text">{selectedDoc.title}</h3>
                <button className="af-button-secondary text-xs flex items-center gap-1">
                  <Download size={12} />
                  Export
                </button>
              </div>
              <div className="flex-1 overflow-y-auto af-card">
                <pre className="text-xs text-af-text-muted whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedDoc.content}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-af-text-muted">
              <div className="text-center">
                <Eye size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Wähle ein Dokument zur Vorschau</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentationPanel;
