import React from 'react';
import { useLayerStore, Layer } from './stores/layerStore';
import { LayerManager } from './components/LayerManager/LayerManager';
import { AgentPanel } from './components/AgentPanel';
import { ConnectorPanel } from './components/ConnectorPanel';
import { SkillMarketplace } from './components/SkillMarketplace';
import { PromptGenerator } from './components/PromptGenerator';
import { ProjectDashboard } from './components/ProjectDashboard';
import { DocumentationPanel } from './components/DocumentationPanel';
import {
  Bot, Plug, Package, Wand2, LayoutDashboard, FileText,
  Layers, Menu, ChevronLeft
} from 'lucide-react';

// Component registry for LayerManager
const componentRegistry: Record<string, React.FC> = {
  'agent-panel': AgentPanel,
  'connector-panel': ConnectorPanel,
  'skill-marketplace': SkillMarketplace,
  'prompt-generator': PromptGenerator,
  'project-dashboard': ProjectDashboard,
  'documentation-panel': DocumentationPanel,
};

const App: React.FC = () => {
  const { addLayer } = useLayerStore();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const navItems = [
    { key: 'agent-panel', label: 'Agenten', icon: Bot, level: 1 },
    { key: 'connector-panel', label: 'Konnektoren', icon: Plug, level: 1 },
    { key: 'skill-marketplace', label: 'Skills', icon: Package, level: 2 },
    { key: 'prompt-generator', label: 'Prompts', icon: Wand2, level: 2 },
    { key: 'project-dashboard', label: 'Dashboard', icon: LayoutDashboard, level: 1 },
    { key: 'documentation-panel', label: 'Doku', icon: FileText, level: 3 },
  ];

  const openPanel = (key: string, title: string, level: number) => {
    addLayer({
      title,
      componentKey: key,
      props: {},
      level,
    });
  };

  const renderLayer = (layer: Layer): React.ReactNode => {
    const Component = componentRegistry[layer.componentKey];
    if (!Component) return <div>Unbekannte Komponente: {layer.componentKey}</div>;
    return <Component {...layer.props} />;
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-af-darker">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-af-dark border-r border-af-border transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-af-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-af-primary to-af-accent flex items-center justify-center flex-shrink-0">
            <Layers size={16} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-af-text">AgentFlow</h1>
              <p className="text-[10px] text-af-text-muted">v1.0.0</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => openPanel(item.key, item.label, item.level)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-af-text-muted 
                         hover:text-af-text hover:bg-af-surface-light transition-all duration-200
                         group"
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={18} className="flex-shrink-0 group-hover:text-af-primary transition-colors" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium animate-fade-in">{item.label}</span>
              )}
              {!sidebarCollapsed && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-af-surface rounded text-af-text-muted">
                  L{item.level}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center py-3 border-t border-af-border text-af-text-muted hover:text-af-text transition-colors"
        >
          {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      {/* Main Content Area with LayerManager */}
      <main className="flex-1 relative">
        <LayerManager renderLayer={renderLayer}>
          {/* Base Layer (Schicht 0) - Workspace */}
          <BaseWorkspace onOpenPanel={openPanel} />
        </LayerManager>
      </main>
    </div>
  );
};

// Base Workspace Component (always visible as Schicht 0)
interface BaseWorkspaceProps {
  onOpenPanel: (key: string, title: string, level: number) => void;
}

const BaseWorkspace: React.FC<BaseWorkspaceProps> = ({ onOpenPanel }) => {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-af-text mb-2">
          Willkommen bei AgentFlow
        </h1>
        <p className="text-sm text-af-text-muted max-w-2xl">
          Multi-Platform AI-Agent-Orchestrierungssystem mit Inverted Pyramid UI.
          Öffne Panels über die Seitenleiste – sie erscheinen als Schichten über diesem Arbeitsfenster.
        </p>
      </div>

      {/* Pyramid Visualization */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-80">
          <div className="text-center mb-2">
            <span className="text-[10px] text-af-text-muted uppercase tracking-widest">Inverted Pyramid UI</span>
          </div>
          {/* Pyramid Layers Visualization */}
          <div className="space-y-1">
            <div className="mx-auto w-full bg-af-surface-light/30 border border-af-border/50 rounded px-4 py-2 text-center">
              <span className="text-[10px] text-af-text-muted">Schicht 3: Dokumentation & Debatten</span>
            </div>
            <div className="mx-auto w-[85%] bg-af-surface-light/40 border border-af-border/50 rounded px-4 py-2 text-center">
              <span className="text-[10px] text-af-text-muted">Schicht 2: Skills & Prompts</span>
            </div>
            <div className="mx-auto w-[70%] bg-af-surface-light/50 border border-af-border/50 rounded px-4 py-2 text-center">
              <span className="text-[10px] text-af-text-muted">Schicht 1: Agenten & Konnektoren</span>
            </div>
            <div className="mx-auto w-[55%] bg-af-primary/20 border border-af-primary/40 rounded px-4 py-3 text-center">
              <span className="text-xs text-af-primary font-medium">Schicht 0: Arbeitsfenster (Basis)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-semibold text-af-text mb-3">Schnellzugriff</h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <QuickAction
          icon={Bot}
          title="Agent starten"
          description="Wähle einen KI-Agenten"
          onClick={() => onOpenPanel('agent-panel', 'Agenten', 1)}
          color="text-af-primary"
        />
        <QuickAction
          icon={LayoutDashboard}
          title="Dashboard"
          description="Projektstatus anzeigen"
          onClick={() => onOpenPanel('project-dashboard', 'Dashboard', 1)}
          color="text-af-accent"
        />
        <QuickAction
          icon={Wand2}
          title="Prompt erstellen"
          description="Prompt-Generator öffnen"
          onClick={() => onOpenPanel('prompt-generator', 'Prompts', 2)}
          color="text-purple-400"
        />
        <QuickAction
          icon={Package}
          title="Skills"
          description="Skill-Marktplatz durchsuchen"
          onClick={() => onOpenPanel('skill-marketplace', 'Skills', 2)}
          color="text-green-400"
        />
        <QuickAction
          icon={Plug}
          title="Konnektoren"
          description="Plattformen verbinden"
          onClick={() => onOpenPanel('connector-panel', 'Konnektoren', 1)}
          color="text-yellow-400"
        />
        <QuickAction
          icon={FileText}
          title="Dokumentation"
          description="Docs generieren"
          onClick={() => onOpenPanel('documentation-panel', 'Doku', 3)}
          color="text-red-400"
        />
      </div>

      {/* System Info */}
      <div className="mt-auto pt-4 border-t border-af-border">
        <div className="flex items-center justify-between text-[10px] text-af-text-muted">
          <span>AgentFlow v1.0.0 | Electron + React 19 + TypeScript</span>
          <span>Inverted Pyramid UI | Zustand State Management</span>
        </div>
      </div>
    </div>
  );
};

interface QuickActionProps {
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, title, description, onClick, color }) => {
  return (
    <button
      onClick={onClick}
      className="af-card text-left hover:scale-[1.02] transition-transform cursor-pointer group"
    >
      <Icon size={20} className={`${color} mb-2 group-hover:scale-110 transition-transform`} />
      <h3 className="text-sm font-medium text-af-text">{title}</h3>
      <p className="text-[10px] text-af-text-muted">{description}</p>
    </button>
  );
};

export default App;
