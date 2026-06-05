# AgentFlow Desktop – Installationsanleitung

## Schnellstart

### Windows

1. Lade `install-windows.bat` herunter oder klone das Repository
2. Doppelklick auf `install-windows.bat`
3. Das Skript prüft Node.js + Git, klont das Repo, baut die App und erstellt Verknüpfungen

```bat
# Alternativ: manuell ausführen
git clone https://github.com/KoMMb0t/agentic-flow.git
cd agentic-flow\packages\agentflow-app
install-windows.bat
```

**Was das Skript erstellt:**
- `%LOCALAPPDATA%\AgentFlow\` – Installationsverzeichnis
- `%USERPROFILE%\Desktop\AgentFlow.lnk` – Desktop-Verknüpfung
- `%APPDATA%\Microsoft\Windows\Start Menu\Programs\AgentFlow\` – Startmenü-Eintrag
- `start-agentflow.bat` – Starter-Skript

### Linux

```bash
git clone https://github.com/KoMMb0t/agentic-flow.git
cd agentic-flow/packages/agentflow-app
chmod +x install-linux.sh
./install-linux.sh
```

**Was das Skript erstellt:**
- `~/.local/share/agentflow/` – Installationsverzeichnis
- `~/.local/bin/agentflow` – Starter-Skript (im PATH)
- `~/.local/share/applications/agentflow.desktop` – Anwendungsmenü-Eintrag
- Icons in `~/.local/share/icons/hicolor/`

**App starten:**
```bash
agentflow
```

---

## Electron-Installer bauen (für Verteilung)

### Voraussetzungen

```bash
node --version   # >= 18.0.0
npm --version    # >= 9.0.0
```

### Build-Befehle

| Befehl | Ausgabe |
|--------|---------|
| `npm run build:win` | `release/AgentFlow-Setup-2.0.0-x64.exe` + Portable |
| `npm run build:linux` | `release/AgentFlow-2.0.0-x64.AppImage` + `.deb` |
| `npm run build:all` | Windows + Linux |
| `npm run build:mac` | macOS `.dmg` (nur auf macOS) |

```bash
cd packages/agentflow-app
npm install
npm run build:linux    # Linux AppImage + .deb
npm run build:win      # Windows NSIS Installer + Portable
```

Die fertigen Installer liegen in `packages/agentflow-app/release/`.

---

## API-Keys konfigurieren

Erstelle eine `.env` Datei im App-Verzeichnis:

```bash
cp .env.example .env
# Dann .env mit deinem Editor öffnen und Keys eintragen
```

```env
# .env (wird NIEMALS committed)
ANTHROPIC_API_KEY=sk-ant-api03-...
GITHUB_TOKEN=ghp_...
GITLAB_TOKEN=glpat-...
OPENAI_API_KEY=sk-proj-...
OPENROUTER_API_KEY=sk-or-v1-...
SLACK_TOKEN=xoxb-...
CLICKUP_TOKEN=pk_...
GOOGLE_API_KEY=AIza...
```

**Alternativ:** API-Keys direkt in der App-UI eingeben:
- Einstellungen → API-Verbindungen → "🔑 Verbinden"
- Keys werden lokal im `localStorage` gespeichert

---

## Systemanforderungen

| Plattform | Anforderung |
|-----------|-------------|
| Windows | Windows 10/11 (x64), Node.js 18+ |
| Linux | Ubuntu 20.04+ / Debian 11+ / Fedora 36+, Node.js 18+ |
| macOS | macOS 12+ (x64 + Apple Silicon) |

---

## Deinstallation

### Windows
```bat
# Verknüpfungen löschen
del "%USERPROFILE%\Desktop\AgentFlow.lnk"
rmdir /s "%APPDATA%\Microsoft\Windows\Start Menu\Programs\AgentFlow"
# Installationsverzeichnis löschen
rmdir /s "%LOCALAPPDATA%\AgentFlow"
```

### Linux
```bash
rm -f ~/.local/bin/agentflow
rm -f ~/.local/share/applications/agentflow.desktop
rm -rf ~/.local/share/agentflow
# Icons entfernen
find ~/.local/share/icons -name "agentflow.png" -delete
```
