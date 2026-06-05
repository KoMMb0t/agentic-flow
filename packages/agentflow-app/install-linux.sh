#!/usr/bin/env bash
# =============================================================
#  AgentFlow Desktop - Linux Installer
#  Version 2.0.0 | KoMMb0t/agentic-flow
# =============================================================
set -euo pipefail

# ── Farben ────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${BOLD}[$1/$TOTAL_STEPS]${NC} $2"; }

TOTAL_STEPS=6

echo ""
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo -e "${CYAN}${BOLD}  AgentFlow Desktop - Linux Installation${NC}"
echo -e "${CYAN}${BOLD}  Version 2.0.0  |  KoMMb0t/agentic-flow${NC}"
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo ""

# ── 1. Voraussetzungen prüfen ─────────────────────────────────
step 1 "Prüfe Voraussetzungen..."

# Node.js
if ! command -v node &>/dev/null; then
    warn "Node.js nicht gefunden. Versuche Installation via nvm..."
    if command -v curl &>/dev/null; then
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        # shellcheck disable=SC1091
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20 && nvm use 20
    else
        error "Node.js ist nicht installiert!\n\n  Installiere es mit:\n    sudo apt install nodejs npm\n  oder: https://nodejs.org/de/download/"
    fi
fi

NODE_VER=$(node --version)
ok "Node.js ${NODE_VER} gefunden"

# npm
if ! command -v npm &>/dev/null; then
    error "npm nicht gefunden. Bitte Node.js vollständig installieren."
fi
ok "npm $(npm --version) gefunden"

# Git
if ! command -v git &>/dev/null; then
    info "Git nicht gefunden. Versuche Installation..."
    if command -v apt-get &>/dev/null; then
        sudo apt-get install -y git
    elif command -v dnf &>/dev/null; then
        sudo dnf install -y git
    elif command -v pacman &>/dev/null; then
        sudo pacman -S --noconfirm git
    else
        error "Git konnte nicht automatisch installiert werden.\nBitte manuell installieren: https://git-scm.com"
    fi
fi
ok "$(git --version) gefunden"

# ── 2. Installationsverzeichnis ──────────────────────────────
step 2 "Installationsverzeichnis einrichten..."

INSTALL_DIR="$HOME/.local/share/agentflow"
mkdir -p "$INSTALL_DIR"
info "Installationsort: $INSTALL_DIR"

# Repo klonen oder aktualisieren
if [ -d "$INSTALL_DIR/agentic-flow/.git" ]; then
    info "Vorhandene Installation gefunden – führe Update durch..."
    cd "$INSTALL_DIR/agentic-flow"
    git pull origin main || warn "git pull fehlgeschlagen – fahre mit vorhandener Version fort"
else
    info "Klone Repository..."
    cd "$INSTALL_DIR"
    git clone https://github.com/KoMMb0t/agentic-flow.git || \
        error "Repository konnte nicht geklont werden!\nBitte prüfe deine Internetverbindung."
fi

APP_DIR="$INSTALL_DIR/agentic-flow/packages/agentflow-app"
cd "$APP_DIR"
ok "App-Verzeichnis: $APP_DIR"

# ── 3. Dependencies installieren ─────────────────────────────
step 3 "Installiere npm-Abhängigkeiten (kann einige Minuten dauern)..."

npm install --prefer-offline 2>&1 || npm install 2>&1
ok "Abhängigkeiten installiert"

# ── 4. App bauen ─────────────────────────────────────────────
step 4 "Baue AgentFlow Desktop App..."

npm run build 2>&1 || error "Build fehlgeschlagen! Bitte prüfe die Ausgabe oben."
ok "Build erfolgreich"

# ── 5. Starter-Skript erstellen ───────────────────────────────
step 5 "Erstelle Starter-Skript..."

LAUNCHER="$HOME/.local/bin/agentflow"
mkdir -p "$HOME/.local/bin"

cat > "$LAUNCHER" << EOF
#!/usr/bin/env bash
# AgentFlow Desktop Launcher
cd "$APP_DIR"
exec npx electron . "\$@"
EOF
chmod +x "$LAUNCHER"
ok "Starter-Skript: $LAUNCHER"

# Sicherstellen dass ~/.local/bin im PATH ist
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    warn "~/.local/bin ist nicht im PATH."
    SHELL_RC=""
    if [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
    elif [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
    fi
    if [ -n "$SHELL_RC" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
        info "PATH wurde zu $SHELL_RC hinzugefügt. Bitte Terminal neu starten."
    fi
fi

# ── 6. .desktop-Datei erstellen ───────────────────────────────
step 6 "Erstelle .desktop-Datei für das Anwendungsmenü..."

DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor"
mkdir -p "$DESKTOP_DIR"

# Icons installieren
for SIZE in 16 32 48 64 128 256 512; do
    SRC="$APP_DIR/build-assets/icon_${SIZE}.png"
    if [ -f "$SRC" ]; then
        ICON_DEST="$ICON_DIR/${SIZE}x${SIZE}/apps"
        mkdir -p "$ICON_DEST"
        cp "$SRC" "$ICON_DEST/agentflow.png"
    fi
done
ok "Icons installiert"

# .desktop-Datei schreiben
DESKTOP_FILE="$DESKTOP_DIR/agentflow.desktop"
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=AgentFlow
GenericName=KI-Agenten Orchestrierung
Comment=AgentFlow Desktop - Multi-Agent Chat, GitHub Dashboard, Skill-Marktplatz und mehr
Exec=$LAUNCHER %U
Icon=agentflow
Terminal=false
Categories=Development;Utility;Science;
Keywords=AI;Agent;Claude;GitHub;Automation;
StartupNotify=true
StartupWMClass=agentflow-desktop
EOF
chmod +x "$DESKTOP_FILE"
ok ".desktop-Datei: $DESKTOP_FILE"

# Desktop-Verknüpfung (falls Desktop-Ordner existiert)
DESKTOP_FOLDER="$HOME/Desktop"
if [ ! -d "$DESKTOP_FOLDER" ]; then
    DESKTOP_FOLDER="$HOME/Schreibtisch"  # Deutsch
fi
if [ -d "$DESKTOP_FOLDER" ]; then
    cp "$DESKTOP_FILE" "$DESKTOP_FOLDER/agentflow.desktop"
    chmod +x "$DESKTOP_FOLDER/agentflow.desktop"
    ok "Desktop-Verknüpfung erstellt: $DESKTOP_FOLDER/agentflow.desktop"
fi

# Desktop-Datenbank aktualisieren
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi
if command -v gtk-update-icon-cache &>/dev/null; then
    gtk-update-icon-cache -f -t "$ICON_DIR" 2>/dev/null || true
fi

# ── Fertig ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo -e "${GREEN}${BOLD}  Installation abgeschlossen!${NC}"
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo ""
echo -e "  ${BOLD}App-Verzeichnis${NC} : $APP_DIR"
echo -e "  ${BOLD}Starter-Skript${NC}  : $LAUNCHER"
echo -e "  ${BOLD}Desktop-Datei${NC}   : $DESKTOP_FILE"
echo ""
echo -e "  ${YELLOW}HINWEIS:${NC} Erstelle eine .env Datei in:"
echo -e "    $APP_DIR/.env"
echo -e "  mit deinen API-Keys (siehe .env.example)"
echo ""
echo -e "  ${BOLD}App starten:${NC}"
echo -e "    Terminal  : agentflow"
echo -e "    Menü      : Anwendungen → Entwicklung → AgentFlow"
echo ""

# App direkt starten?
read -r -p "AgentFlow jetzt starten? (j/n): " START_NOW
if [[ "$START_NOW" =~ ^[jJyY]$ ]]; then
    info "Starte AgentFlow..."
    nohup "$LAUNCHER" &>/dev/null &
    ok "AgentFlow gestartet (PID: $!)"
fi

echo ""
