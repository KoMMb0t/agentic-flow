import React from 'react';
import { useAppStore } from '../stores/appStore';
import type { ViewType } from '../types';

interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
  group: string;
}

const navItems: NavItem[] = [
  { id: 'chat', label: 'Multi-Agent Chat', icon: '💬', group: 'Agenten' },
  { id: 'registry', label: 'Agent Registry', icon: '🤖', group: 'Agenten' },
  { id: 'router', label: 'Message Router', icon: '🔀', group: 'Agenten' },
  { id: 'dashboard', label: 'GitHub Dashboard', icon: '📊', group: 'Projekt' },
  { id: 'tasks', label: 'Aufgaben', icon: '✅', group: 'Projekt' },
  { id: 'docs', label: 'Dokumentation', icon: '📝', group: 'Projekt' },
  { id: 'skills', label: 'Skill-Marktplatz', icon: '🧩', group: 'Tools' },
  { id: 'prompts', label: 'Prompt-Generator', icon: '✨', group: 'Tools' },
  { id: 'connectors', label: 'Konnektoren', icon: '🔌', group: 'Tools' },
  { id: 'settings', label: 'Einstellungen', icon: '⚙️', group: 'System' },
];

const Sidebar: React.FC = () => {
  const { activeView, setActiveView, sidebarOpen } = useAppStore();

  if (!sidebarOpen) {
    return (
      <div className="w-12 bg-af-dark border-r border-af-border flex flex-col items-center py-3 gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-sm ${
              activeView === item.id
                ? 'bg-af-accent/20 ring-1 ring-af-accent'
                : 'hover:bg-af-surface'
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
    );
  }

  const groups = navItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <div className="w-56 bg-af-dark border-r border-af-border flex flex-col overflow-y-auto">
      <div className="p-3 space-y-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-af-muted mb-1.5 px-2">
              {group}
            </h3>
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    activeView === item.id
                      ? 'bg-af-accent/15 text-af-accent ring-1 ring-af-accent/30'
                      : 'text-af-muted hover:text-af-text hover:bg-af-surface'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
