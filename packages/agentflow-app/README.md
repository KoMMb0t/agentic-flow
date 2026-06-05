# AgentFlow Desktop v2.0 (Unified)

Multi-Platform KI-Agenten Orchestrierung mit echten API-Integrationen.

## Features

| Modul | Beschreibung |
|-------|-------------|
| **Multi-Agent Chat** | Claude (echt), GPT-4, Gemini, Mistral, Llama 3 (simuliert) |
| **Agent Router (AFJP)** | AgentFlow JSON Protocol v1.0 für Message-Routing |
| **Agent Registry** | Verwaltung aller Agenten mit Status und Konfiguration |
| **GitHub Dashboard** | Echte Daten: Repos, Commits, Issues, PRs |
| **Aufgabenverwaltung** | Tasks mit GitHub-Issue-Sync |
| **Dokumentations-Generator** | Automatische README/API/Code-Doku via Claude |
| **Skill-Marktplatz** | 12 installierbare Skills |
| **Prompt-Generator** | 8 Template-basierte Prompt-Vorlagen |
| **Konnektor-Management** | GitHub, GitLab, Anthropic, OpenAI, Slack |
| **Inverted Pyramid UI** | Layer-basiertes Fenstersystem |

## Tech-Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS + Zustand
- **Desktop:** Electron 33
- **Build:** Vite 6
- **APIs:** Anthropic Claude, GitHub REST API, GitLab API

## Installation

```bash
npm install
cp .env.example .env
# .env mit echten API-Keys befüllen
```

## Entwicklung

```bash
npm run dev
```

## Build

```bash
npm run build
npm run package
```

## Sicherheit

- API-Keys werden ausschließlich im Electron Main-Prozess gehalten
- Context Isolation + IPC-Channels für sichere Kommunikation
- Kein `nodeIntegration` im Renderer
- `.env` ist in `.gitignore` und wird nie committed

## Lizenz

MIT - KoMMb0t
