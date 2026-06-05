import React from 'react';
import UpdateButton from './UpdateButton';

const TitleBar: React.FC = () => {
  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  return (
    <div
      className="h-8 bg-af-dark border-b border-af-border flex items-center justify-between px-3 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: App name + version */}
      <div className="flex items-center gap-2">
        <span className="text-af-accent font-bold text-xs tracking-wider">AGENTFLOW</span>
        <span className="text-af-muted text-[10px]">v2.0</span>
      </div>

      {/* Right: Update button + window controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {/* Update button – auto-checks on mount */}
        <UpdateButton variant="compact" autoCheck />

        {/* Divider */}
        <div className="w-px h-4 bg-af-border mx-1" />

        {/* Window controls */}
        <button
          onClick={handleMinimize}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-af-surface text-af-muted hover:text-af-text transition-colors"
          title="Minimieren"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-af-surface text-af-muted hover:text-af-text transition-colors"
          title="Maximieren"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <rect x="1" y="1" width="8" height="8" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-af-muted hover:text-red-400 transition-colors"
          title="Schließen"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
