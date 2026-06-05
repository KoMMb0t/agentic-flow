import React, { useState } from 'react';
import { useSkillStore, Skill } from '../../stores/skillStore';
import { useAgentStore } from '../../stores/agentStore';
import { Search, Download, Trash2, Star, Tag, Users, ChevronDown } from 'lucide-react';

export const SkillMarketplace: React.FC = () => {
  const {
    skills,
    searchQuery,
    selectedCategory,
    installSkill,
    uninstallSkill,
    assignToAgent,
    removeFromAgent,
    setSearchQuery,
    setSelectedCategory,
    getFilteredSkills,
    getCategories,
  } = useSkillStore();

  const { agents } = useAgentStore();
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const filteredSkills = getFilteredSkills();
  const categories = getCategories();

  const installedCount = skills.filter(s => s.installed).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-af-text">Skill-Marktplatz</h2>
            <p className="text-xs text-af-text-muted">{installedCount} installiert / {skills.length} verfügbar</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-af-text-muted" />
          <input
            type="text"
            placeholder="Skills durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="af-input pl-9 text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-af-primary text-white'
                  : 'bg-af-surface-light text-af-text-muted hover:text-af-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skill List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredSkills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            expanded={expandedSkill === skill.id}
            onToggleExpand={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}
            onInstall={() => installSkill(skill.id)}
            onUninstall={() => uninstallSkill(skill.id)}
            onAssign={(agentId) => assignToAgent(skill.id, agentId)}
            onRemoveAgent={(agentId) => removeFromAgent(skill.id, agentId)}
            agents={agents}
          />
        ))}

        {filteredSkills.length === 0 && (
          <div className="text-center py-8 text-af-text-muted">
            <p>Keine Skills gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SkillCardProps {
  skill: Skill;
  expanded: boolean;
  onToggleExpand: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onAssign: (agentId: string) => void;
  onRemoveAgent: (agentId: string) => void;
  agents: { id: string; name: string; icon: string }[];
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill, expanded, onToggleExpand, onInstall, onUninstall, onAssign, onRemoveAgent, agents
}) => {
  return (
    <div className={`af-card transition-all ${expanded ? 'ring-1 ring-af-primary/50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-af-text truncate">{skill.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 bg-af-surface-light rounded text-af-text-muted">
              v{skill.version}
            </span>
            {skill.installed && (
              <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded">
                Installiert
              </span>
            )}
          </div>
          <p className="text-xs text-af-text-muted mb-2">{skill.description}</p>
          <div className="flex items-center gap-3 text-[10px] text-af-text-muted">
            <span className="flex items-center gap-1">
              <Star size={10} className="text-yellow-400" />
              {skill.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download size={10} />
              {skill.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Tag size={10} />
              {skill.category}
            </span>
            <span className="flex items-center gap-1">
              <Users size={10} />
              {skill.compatibleAgents.length} Agenten
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {skill.installed ? (
            <button
              onClick={onUninstall}
              className="p-1.5 rounded hover:bg-red-500/10 text-af-text-muted hover:text-red-400 transition-colors"
              title="Deinstallieren"
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <button
              onClick={onInstall}
              className="af-button-primary text-xs px-3 py-1.5"
            >
              <Download size={12} className="inline mr-1" />
              Installieren
            </button>
          )}
          <button
            onClick={onToggleExpand}
            className={`p-1.5 rounded hover:bg-af-surface-light text-af-text-muted transition-all ${expanded ? 'rotate-180' : ''}`}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-af-border animate-fade-in">
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {skill.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-af-dark rounded-full text-af-text-muted">
                #{tag}
              </span>
            ))}
          </div>

          {/* Agent Assignment */}
          {skill.installed && (
            <div>
              <p className="text-xs font-medium text-af-text mb-2">Agenten-Zuweisung:</p>
              <div className="flex flex-wrap gap-1.5">
                {skill.compatibleAgents.map((agentId) => {
                  const agent = agents.find(a => a.id === agentId);
                  if (!agent) return null;
                  const isAssigned = skill.assignedAgents.includes(agentId);
                  return (
                    <button
                      key={agentId}
                      onClick={() => isAssigned ? onRemoveAgent(agentId) : onAssign(agentId)}
                      className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                        isAssigned
                          ? 'bg-af-primary/20 text-af-primary border border-af-primary/30'
                          : 'bg-af-dark text-af-text-muted hover:text-af-text border border-af-border'
                      }`}
                    >
                      <span>{agent.icon}</span>
                      <span>{agent.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Author */}
          <p className="text-[10px] text-af-text-muted mt-2">
            Autor: {skill.author}
          </p>
        </div>
      )}
    </div>
  );
};

export default SkillMarketplace;
