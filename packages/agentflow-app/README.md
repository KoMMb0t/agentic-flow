# AgentFlow Desktop App

Multi-Platform AI-Agent-Orchestrierungssystem mit Inverted Pyramid UI.

## Features

- **Inverted Pyramid UI** - Innovatives Schichten-basiertes Fenstermanagement
- **13 KI-Agenten** - Manus, Claude, ChatGPT, Gemini, Copilot, OpenClaw, etc.
- **8 Plattform-Konnektoren** - Slack, GitHub, GitLab, ClickUp, Google Drive, etc.
- **Skill-Marktplatz** - Installierbare Fähigkeiten für Agenten
- **Prompt-Generator** - Template-basierte Prompt-Erstellung
- **Projektstatus-Dashboard** - Aggregierte Übersicht aller Plattformen
- **Dokumentations-Engine** - Automatische Dokumentationserstellung

## Tech Stack

- **Runtime:** Electron (Desktop)
- **Frontend:** React 19 + TypeScript
- **Styling:** TailwindCSS
- **State:** Zustand
- **Build:** Vite
- **Icons:** Lucide React

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten (nur Web)
npm run dev

# Electron App starten (Dev)
npm run electron:dev

# Production Build
npm run build

# Electron App bauen
npm run electron:build
```

## Projektstruktur

```
agentflow-app/
├── electron/              # Electron Main Process
│   └── main.cjs
├── src/
│   ├── components/
│   │   ├── LayerManager/       # Inverted Pyramid UI Engine
│   │   ├── AgentPanel/         # KI-Agenten Auswahl & Chat
│   │   ├── ConnectorPanel/     # Plattform-Konnektoren
│   │   ├── SkillMarketplace/   # Skill-Marktplatz
│   │   ├── PromptGenerator/    # Prompt-Generator
│   │   ├── ProjectDashboard/   # Projektstatus-Dashboard
│   │   └── DocumentationPanel/ # Dokumentation
│   ├── stores/
│   │   ├── layerStore.ts       # Layer/Pyramid State
│   │   ├── agentStore.ts       # Agenten & Chat State
│   │   ├── connectorStore.ts   # Konnektor State
│   │   └── skillStore.ts       # Skill-Marktplatz State
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Inverted Pyramid UI Konzept

```
       ▲  [Schicht 3: Dokumentation / Debatten]
      / \
     /   \ [Schicht 2: Skills / Prompts]
    /     \
   /       \ [Schicht 1: Agenten / Konnektoren / Dashboard]
  /=========\
  |  Basis  | [Schicht 0: Hauptarbeitsfenster]
  └─────────┘
```

- **Schicht 0 (Basis):** Immer sichtbar, das Hauptarbeitsfenster
- **Schicht 1-3:** Panels öffnen sich als Schichten darüber
- **"Alles minimieren":** Sofort zurück zur Basis
- **"Alles zurück":** Alle minimierten Fenster wiederherstellen

## Lizenz

MIT
