# Claude Code Prompt: AgentFlow Integration in agentic-flow

## Kontext

Du arbeitest am Open-Source-Projekt `agentic-flow` (https://github.com/ruvnet/agentic-flow) – ein produktionsreifes AI-Agent-Orchestrierungssystem mit 66 selbstlernenden Agenten, 213 MCP-Tools, TypeScript/Node.js-Basis, Flash Attention, GNN, SONA und Swarm-Koordination.

Deine Aufgabe ist es, dieses Projekt um das **AgentFlow-Erweiterungskonzept** zu erweitern – eine Multi-Platform Orchestrierungs-App mit erweitertem Konnektor-System, Skill-Marktplatz und einem innovativen UI-Konzept.

---

## Aufgabe

Integriere folgende Module und Features in die bestehende agentic-flow Architektur:

---

### 1. Multi-Platform App (Tauri + Capacitor + React)

Erstelle eine Cross-Platform Desktop- und Mobile-App:

- **Desktop (Windows, Linux):** Tauri v2 + Rust (native Webview, ~90% kleiner als Electron)
- **Mobile (Android):** Capacitor mit gleicher React-Codebasis
- **Frontend:** React 19 + TypeScript + TailwindCSS
- **Shared Codebase:** `src/app/` für die gemeinsame UI-Logik

Struktur:
```
src/
  app/                    # Shared React App
    components/
    pages/
    hooks/
    stores/
  desktop/                # Tauri-spezifisch
    src-tauri/
  mobile/                 # Capacitor-spezifisch
    android/
```

---

### 2. Umgekehrte Pyramiden-Navigation (Inverted Pyramid UI)

Implementiere folgendes Fenster-Management-System als zentrales UI-Prinzip:

- **Arbeitsfenster = Basis (unterste Schicht):** Das Hauptarbeitsfenster ist immer die unterste Ebene.
- **Neue Fenster öffnen sich darüber:** Links, Panels, Agenten-Antworten erscheinen als Schichten ÜBER dem Arbeitsfenster (Stack nach oben).
- **"Collapse All"-Button auf jeder Schicht:** Ein Symbol auf jedem Fenster minimiert ALLE Schichten darüber → sofort zurück zum Arbeitsfenster.
- **"Restore All"-Button:** Bringt alle minimierten Fenster zurück.

Implementierung:
```typescript
// src/app/stores/layerStore.ts
interface Layer {
  id: string;
  component: React.ComponentType;
  props: Record<string, any>;
  minimized: boolean;
  zIndex: number;
}

interface LayerStore {
  layers: Layer[];
  addLayer: (layer: Omit<Layer, 'id' | 'zIndex' | 'minimized'>) => void;
  collapseAllAbove: (layerId: string) => void;
  restoreAll: () => void;
  removeLayer: (layerId: string) => void;
}
```

Erstelle eine `<LayerManager>` Komponente die den Stack rendert, und ein `<LayerControls>` Widget mit den Collapse/Restore Buttons.

---

### 3. Plattform-Konnektoren

Erstelle ein erweiterbares Konnektor-System unter `src/connectors/`:

```
src/connectors/
  base.ts               # Abstract BaseConnector class
  registry.ts           # Connector Registry (Plugin-System)
  slack/
    index.ts            # Slack Bot + OAuth + Events API
    messages.ts
    channels.ts
  github/               # Erweitere bestehende GitHub-Integration
    index.ts
    repos.ts
    issues.ts
    prs.ts
  gitlab/
    index.ts
    merge-requests.ts
    pipelines.ts
  bitbucket/
    index.ts
    pull-requests.ts
  clickup/
    index.ts
    tasks.ts
    spaces.ts
  google-drive/
    index.ts
    files.ts
    folders.ts
  terrabox/
    index.ts
    storage.ts
  local-storage/
    index.ts
    filesystem.ts
```

Jeder Konnektor implementiert:
```typescript
abstract class BaseConnector {
  abstract name: string;
  abstract authenticate(credentials: ConnectorCredentials): Promise<void>;
  abstract sendMessage(payload: AgentFlowMessage): Promise<ConnectorResponse>;
  abstract receiveMessages(): AsyncGenerator<AgentFlowMessage>;
  abstract getStatus(): Promise<ConnectorStatus>;
  abstract disconnect(): Promise<void>;
}
```

Nutzer sollen über die UI eigene Konnektoren hinzufügen können (Plugin-Architektur mit dynamischem Import).

---

### 4. Skill-Marktplatz

Erstelle einen Skill-Marktplatz unter `src/skills-marketplace/`:

```
src/skills-marketplace/
  index.ts
  skill-registry.ts     # Lokales Skill-Register
  marketplace-api.ts    # Remote Marketplace API
  skill-loader.ts       # Dynamisches Laden von Skills
  types.ts
```

Skills sind modulare Fähigkeiten:
```typescript
interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  rating: number;
  downloads: number;
  compatibleAgents: string[];  // Welche Agenten diesen Skill nutzen können
  entrypoint: string;          // Pfad zur Hauptdatei
  permissions: string[];       // Benötigte Berechtigungen
  execute: (context: SkillContext) => Promise<SkillResult>;
}
```

Features:
- Agenten können sich selbstständig Skills holen (auto-discovery)
- Nutzer können Skills hochladen, bewerten, herunterladen
- Versionierung (semver)
- Abhängigkeiten zwischen Skills
- Berechtigungssystem

---

### 5. Erweiterte Agenten-Integration

Integriere folgende externe KI-Agenten unter `src/agents/external/`:

```
src/agents/external/
  base-external-agent.ts
  manus.ts
  monica.ts
  github-copilot.ts
  openclaw.ts
  chatgpt.ts
  gemini.ts
  perplexity.ts
  jarvis.ts
  claude.ts
  claude-code.ts
  deepseek.ts
  mistral.ts
  le-chat.ts
```

Einheitliches Datenformat (AgentFlow JSON Protocol - AFJP):
```json
{
  "version": "1.0",
  "id": "uuid-v4",
  "timestamp": "ISO-8601",
  "sender": {
    "type": "agent|user|system",
    "id": "agent-identifier",
    "name": "Display Name"
  },
  "receiver": {
    "type": "agent|user|broadcast",
    "id": "target-identifier",
    "name": "Display Name"
  },
  "message": {
    "type": "request|response|notification|error",
    "content": "string",
    "format": "text|markdown|code|json",
    "metadata": {
      "priority": "low|medium|high|critical",
      "tags": ["string"],
      "context": {},
      "skill_required": "optional-skill-id",
      "thread_id": "conversation-thread-id"
    }
  },
  "routing": {
    "via": ["connector-ids"],
    "fallback": ["alternative-agent-ids"],
    "timeout_ms": 30000
  }
}
```

---

### 6. Prompt-Generator

Erstelle einen Prompt-Generator unter `src/app/components/PromptGenerator/`:

```typescript
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  targetAgent: string;
  template: string;        // Mit {{variablen}}
  variables: PromptVariable[];
  category: string;
}

interface PromptVariable {
  name: string;
  type: 'text' | 'select' | 'multiline' | 'number';
  options?: string[];
  default?: string;
  required: boolean;
}
```

Features:
- Vorlagen-Bibliothek für verschiedene Agenten
- Variablen-Ersetzung
- Prompt-Optimierung (automatische Verbesserungsvorschläge)
- History der generierten Prompts
- Teilen von Prompt-Templates über den Skill-Marktplatz

---

### 7. Projektstatus-Dashboard

Erstelle ein Dashboard unter `src/app/pages/ProjectDashboard/`:

- Aggregierter Status über alle verbundenen Plattformen
- GitHub/GitLab: Open Issues, PRs, Pipeline-Status
- ClickUp: Aufgaben-Fortschritt
- Slack: Ungelesene Nachrichten, aktive Threads
- Google Drive: Letzte Änderungen
- Agenten-Status: Welcher Agent ist aktiv, was macht er gerade

---

### 8. Automatische Dokumentationserstellung

Erstelle ein Modul unter `src/documentation/`:

- Generiert Dokumentation aus Code, Konversationen und Projektstatus
- Unterstützt Markdown, PDF-Export
- Kann an Google Drive oder lokalen Speicher pushen
- Nutzt Agenten für intelligente Zusammenfassungen

---

## Technische Anforderungen

- TypeScript strict mode
- ESM modules
- Bestehende agentic-flow Tests nicht brechen
- Neue Module mit Unit-Tests (Vitest)
- Dokumentation für jedes neue Modul
- Package.json Workspaces für Monorepo-Struktur

## Reihenfolge der Implementierung

1. Konnektor-Basis-System (`BaseConnector`, Registry)
2. AFJP Datenformat + Message Router
3. Externe Agenten-Integration (mindestens 3 zum Start)
4. Skill-Marktplatz Grundstruktur
5. Multi-Platform App Setup (Tauri + React)
6. Inverted Pyramid UI
7. Prompt-Generator
8. Projektstatus-Dashboard
9. Dokumentations-Modul
10. Einzelne Konnektoren (Slack, GitLab, ClickUp, etc.)

---

## Starte jetzt mit Schritt 1 und arbeite dich durch die Liste. Frage bei Unklarheiten nach.
