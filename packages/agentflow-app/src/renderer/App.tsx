import React from 'react';
import { useAppStore } from './stores/appStore';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MultiAgentChat from './components/MultiAgentChat';
import AgentRegistry from './components/AgentRegistry';
import MessageRouter from './components/MessageRouter';
import GitHubDashboard from './components/GitHubDashboard';
import TaskManager from './components/TaskManager';
import DocsGenerator from './components/DocsGenerator';
import SkillMarketplace from './components/SkillMarketplace';
import PromptGenerator from './components/PromptGenerator';
import ConnectorManager from './components/ConnectorManager';
import Settings from './components/Settings';
import PyramidLayers from './components/PyramidLayers';
import NotificationStack from './components/NotificationStack';

const App: React.FC = () => {
  const { activeView, sidebarOpen, toggleSidebar, addLayer } = useAppStore();

  const renderContent = () => {
    switch (activeView) {
      case 'chat': return <MultiAgentChat />;
      case 'registry': return <AgentRegistry />;
      case 'router': return <MessageRouter />;
      case 'dashboard': return <GitHubDashboard />;
      case 'tasks': return <TaskManager />;
      case 'docs': return <DocsGenerator />;
      case 'skills': return <SkillMarketplace />;
      case 'prompts': return <PromptGenerator />;
      case 'connectors': return <ConnectorManager />;
      case 'settings': return <Settings />;
      default: return <MultiAgentChat />;
    }
  };

  const viewTitle: Record<string, string> = {
    chat: 'Multi-Agent Chat',
    registry: 'Agent Registry',
    router: 'AFJP Message Router',
    dashboard: 'GitHub Dashboard',
    tasks: 'Aufgabenverwaltung',
    docs: 'Dokumentations-Generator',
    skills: 'Skill-Marktplatz',
    prompts: 'Prompt-Generator',
    connectors: 'Konnektor-Management',
    settings: 'Einstellungen',
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-af-dark overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header Bar */}
          <div className="shrink-0 h-10 flex items-center justify-between px-4 border-b border-af-border bg-af-dark/50">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="text-af-muted hover:text-af-text text-xs p-1 rounded hover:bg-af-surface transition-colors"
                title="Sidebar umschalten"
              >
                {sidebarOpen ? '◀' : '▶'}
              </button>
              <h2 className="text-sm font-medium text-af-text">
                {viewTitle[activeView] || activeView}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => addLayer(viewTitle[activeView] || 'Layer', activeView)}
                className="text-[10px] text-af-muted hover:text-af-accent px-2 py-1 rounded hover:bg-af-surface transition-colors"
                title="Als Layer öffnen"
              >
                + Layer
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>

          {/* Pyramid Layers */}
          <PyramidLayers />
        </div>
      </div>

      {/* Notifications */}
      <NotificationStack />
    </div>
  );
};

export default App;
