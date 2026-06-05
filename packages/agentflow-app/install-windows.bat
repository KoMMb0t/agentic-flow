@echo off
setlocal EnableDelayedExpansion
title AgentFlow Desktop - Windows Installer
color 0B

echo.
echo  ============================================================
echo   AgentFlow Desktop - Windows Installation
echo   Version 2.0.0  ^|  KoMMb0t/agentic-flow
echo  ============================================================
echo.

:: ── 1. Node.js prüfen ────────────────────────────────────────
echo [1/6] Prüfe Node.js Installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [FEHLER] Node.js ist nicht installiert!
    echo.
    echo  Bitte installiere Node.js 18+ von:
    echo    https://nodejs.org/de/download/
    echo.
    echo  Nach der Installation dieses Skript erneut ausführen.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  OK - Node.js %NODE_VER% gefunden

:: ── 2. Git prüfen ────────────────────────────────────────────
echo.
echo [2/6] Prüfe Git Installation...
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [FEHLER] Git ist nicht installiert!
    echo.
    echo  Bitte installiere Git von:
    echo    https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('git --version') do set GIT_VER=%%v
echo  OK - %GIT_VER% gefunden

:: ── 3. Installationsverzeichnis ──────────────────────────────
echo.
echo [3/6] Installationsverzeichnis...
set "INSTALL_DIR=%LOCALAPPDATA%\AgentFlow"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo  Installationsort: %INSTALL_DIR%

:: Repo klonen oder aktualisieren
if exist "%INSTALL_DIR%\agentic-flow\.git" (
    echo  Vorhandene Installation gefunden - führe Update durch...
    cd /d "%INSTALL_DIR%\agentic-flow"
    git pull origin main
    if %ERRORLEVEL% NEQ 0 (
        echo  [WARNUNG] git pull fehlgeschlagen - fahre mit vorhandener Version fort
    )
) else (
    echo  Klone Repository...
    cd /d "%INSTALL_DIR%"
    git clone https://github.com/KoMMb0t/agentic-flow.git
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [FEHLER] Repository konnte nicht geklont werden!
        echo  Bitte prüfe deine Internetverbindung.
        pause
        exit /b 1
    )
)

set "APP_DIR=%INSTALL_DIR%\agentic-flow\packages\agentflow-app"
cd /d "%APP_DIR%"

:: ── 4. Dependencies installieren ─────────────────────────────
echo.
echo [4/6] Installiere npm-Abhängigkeiten (kann einige Minuten dauern)...
call npm install --prefer-offline 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [WARNUNG] npm install mit Fehlern - versuche erneut...
    call npm install 2>&1
)
echo  OK - Abhängigkeiten installiert

:: ── 5. App bauen ─────────────────────────────────────────────
echo.
echo [5/6] Baue AgentFlow Desktop App...
call npm run build 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [FEHLER] Build fehlgeschlagen!
    echo  Bitte prüfe die Ausgabe oben auf Fehler.
    pause
    exit /b 1
)
echo  OK - Build erfolgreich

:: ── 6. Verknüpfungen erstellen ───────────────────────────────
echo.
echo [6/6] Erstelle Verknüpfungen...

:: start-agentflow.bat erstellen
set "LAUNCHER=%INSTALL_DIR%\start-agentflow.bat"
(
    echo @echo off
    echo cd /d "%APP_DIR%"
    echo start "" npx electron .
) > "%LAUNCHER%"

:: Desktop-Verknüpfung via PowerShell
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=AgentFlow.lnk"
powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; ^
     $s = $ws.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%'); ^
     $s.TargetPath = '%LAUNCHER%'; ^
     $s.WorkingDirectory = '%APP_DIR%'; ^
     $s.Description = 'AgentFlow Desktop - KI-Agenten Orchestrierung'; ^
     $s.IconLocation = '%APP_DIR%\build-assets\icon.ico'; ^
     $s.Save()" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  OK - Desktop-Verknüpfung erstellt: %DESKTOP%\%SHORTCUT_NAME%
) else (
    echo  [WARNUNG] Desktop-Verknüpfung konnte nicht erstellt werden
)

:: Startmenü-Eintrag erstellen
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs\AgentFlow"
if not exist "%STARTMENU%" mkdir "%STARTMENU%"
powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; ^
     $s = $ws.CreateShortcut('%STARTMENU%\AgentFlow.lnk'); ^
     $s.TargetPath = '%LAUNCHER%'; ^
     $s.WorkingDirectory = '%APP_DIR%'; ^
     $s.Description = 'AgentFlow Desktop - KI-Agenten Orchestrierung'; ^
     $s.IconLocation = '%APP_DIR%\build-assets\icon.ico'; ^
     $s.Save()" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  OK - Startmenü-Eintrag erstellt: %STARTMENU%
) else (
    echo  [WARNUNG] Startmenü-Eintrag konnte nicht erstellt werden
)

:: ── Fertig ───────────────────────────────────────────────────
echo.
echo  ============================================================
echo   Installation abgeschlossen!
echo  ============================================================
echo.
echo   App-Verzeichnis : %APP_DIR%
echo   Starter-Skript  : %LAUNCHER%
echo   Desktop         : %DESKTOP%\%SHORTCUT_NAME%
echo   Startmenü       : %STARTMENU%\AgentFlow.lnk
echo.
echo   HINWEIS: Erstelle eine .env Datei in:
echo     %APP_DIR%\.env
echo   mit deinen API-Keys (siehe .env.example)
echo.
echo   App starten: Doppelklick auf Desktop-Verknüpfung
echo             oder: %LAUNCHER%
echo.

set /p START_NOW="AgentFlow jetzt starten? (j/n): "
if /i "%START_NOW%"=="j" (
    echo  Starte AgentFlow...
    start "" "%LAUNCHER%"
)

pause
endlocal
