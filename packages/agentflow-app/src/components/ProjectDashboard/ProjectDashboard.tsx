import React from 'react';
import { useConnectorStore } from '../../stores/connectorStore';
import { useAgentStore } from '../../stores/agentStore';
import { useSkillStore } from '../../stores/skillStore';
import {
  GitBranch, MessageSquare, CheckSquare, FolderOpen,
  Activity, TrendingUp, AlertCircle, Clock, Users, Zap
} from 'lucide-react';

interface StatusCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  value: string;
  subtitle: string;
  status: 'good' | 'warning' | 'error' | 'neutral';
  details: string[];
}

export const ProjectDashboard: React.FC = () => {
  const { connectors } = useConnectorStore();
  const { agents } = useAgentStore();
  const { skills } = useSkillStore();

  const connectedPlatforms = connectors.filter(c => c.status === 'connected');
  const onlineAgents = agents.filter(a => a.status === 'online');
  const installedSkills = skills.filter(s => s.installed);

  // Mock data for project status
  const statusCards: StatusCard[] = [
    {
      id: 'github',
      title: 'GitHub',
      icon: <GitBranch size={20} className="text-green-400" />,
      value: '12 PRs offen',
      subtitle: '3 Reviews ausstehend',
      status: 'warning',
      details: ['feat/agent-panel: 2 Approvals', 'fix/connector-auth: CI failed', 'docs/api-reference: Ready to merge'],
    },
    {
      id: 'slack',
      title: 'Slack',
      icon: <MessageSquare size={20} className="text-purple-400" />,
      value: '8 ungelesen',
      subtitle: '#agentflow-dev aktiv',
      status: 'good',
      details: ['@team: Deployment heute 18:00', '#bugs: Neuer Report von QA', '#general: Sprint Review morgen'],
    },
    {
      id: 'clickup',
      title: 'ClickUp',
      icon: <CheckSquare size={20} className="text-blue-400" />,
      value: '24/38 Tasks',
      subtitle: 'Sprint 14 - 63% erledigt',
      status: 'good',
      details: ['In Progress: 8 Tasks', 'Review: 4 Tasks', 'Blocked: 2 Tasks'],
    },
    {
      id: 'gdrive',
      title: 'Google Drive',
      icon: <FolderOpen size={20} className="text-yellow-400" />,
      value: '3 neue Dateien',
      subtitle: 'Letzte Änderung: vor 2h',
      status: 'neutral',
      details: ['Architecture-v3.pdf hochgeladen', 'Meeting-Notes-05-06.md geändert', 'API-Spec.yaml aktualisiert'],
    },
  ];

  const tasks = [
    { id: 1, title: 'Inverted Pyramid UI fertigstellen', status: 'in-progress', priority: 'high', agent: 'claude-code' },
    { id: 2, title: 'Slack-Konnektor OAuth implementieren', status: 'todo', priority: 'medium', agent: 'manus' },
    { id: 3, title: 'Skill-Marktplatz API-Endpoints', status: 'in-progress', priority: 'high', agent: 'deepseek' },
    { id: 4, title: 'E2E-Tests für Agent-Chat', status: 'todo', priority: 'low', agent: null },
    { id: 5, title: 'Dokumentation aktualisieren', status: 'done', priority: 'medium', agent: 'claude' },
    { id: 6, title: 'Performance-Optimierung LayerManager', status: 'todo', priority: 'medium', agent: null },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-green-400 bg-green-500/10';
      default: return 'text-af-text-muted bg-af-surface-light';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <Activity size={12} className="text-green-400" />;
      case 'warning': return <AlertCircle size={12} className="text-yellow-400" />;
      case 'error': return <AlertCircle size={12} className="text-red-400" />;
      default: return <Activity size={12} className="text-af-text-muted" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="af-card text-center">
          <Zap size={20} className="text-af-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-af-text">{connectedPlatforms.length}</p>
          <p className="text-[10px] text-af-text-muted">Plattformen</p>
        </div>
        <div className="af-card text-center">
          <Users size={20} className="text-af-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-af-text">{onlineAgents.length}</p>
          <p className="text-[10px] text-af-text-muted">Agenten Online</p>
        </div>
        <div className="af-card text-center">
          <TrendingUp size={20} className="text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-af-text">{installedSkills.length}</p>
          <p className="text-[10px] text-af-text-muted">Skills aktiv</p>
        </div>
        <div className="af-card text-center">
          <Clock size={20} className="text-yellow-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-af-text">63%</p>
          <p className="text-[10px] text-af-text-muted">Sprint-Fortschritt</p>
        </div>
      </div>

      {/* Platform Status Cards */}
      <h3 className="text-sm font-semibold text-af-text mb-3">Plattform-Status</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statusCards.map((card) => (
          <div key={card.id} className="af-card">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {card.icon}
                <h4 className="text-sm font-medium text-af-text">{card.title}</h4>
              </div>
              {getStatusIcon(card.status)}
            </div>
            <p className="text-sm font-semibold text-af-text">{card.value}</p>
            <p className="text-[10px] text-af-text-muted mb-2">{card.subtitle}</p>
            <div className="space-y-1">
              {card.details.map((detail, i) => (
                <p key={i} className="text-[10px] text-af-text-muted pl-2 border-l border-af-border">
                  {detail}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task List */}
      <h3 className="text-sm font-semibold text-af-text mb-3">Aufgabenliste</h3>
      <div className="space-y-2">
        {tasks.map((task) => {
          const agent = agents.find(a => a.id === task.agent);
          return (
            <div key={task.id} className="af-card flex items-center gap-3 py-3">
              <div className={`w-2 h-2 rounded-full ${
                task.status === 'done' ? 'bg-green-400' :
                task.status === 'in-progress' ? 'bg-yellow-400 animate-pulse' :
                'bg-af-border'
              }`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${task.status === 'done' ? 'text-af-text-muted line-through' : 'text-af-text'}`}>
                  {task.title}
                </p>
              </div>
              {agent && (
                <span className="text-xs px-2 py-0.5 bg-af-dark rounded flex items-center gap-1">
                  <span>{agent.icon}</span>
                  <span className="text-af-text-muted">{agent.name}</span>
                </span>
              )}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectDashboard;
