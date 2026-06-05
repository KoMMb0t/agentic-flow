import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import type { Skill } from '../types';

const SkillMarketplace: React.FC = () => {
  const { skills, setSkills, installSkill, uninstallSkill, addNotification } = useAppStore();
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.readSkills();
        setSkills(data.skills || []);
      } catch (err) {
        console.error('Failed to load skills:', err);
      }
    }
  }

  async function handleInstall(skill: Skill) {
    installSkill(skill.id);
    addNotification({
      type: 'success',
      title: 'Skill installiert',
      message: `${skill.name} v${skill.version} wurde installiert.`,
    });

    if (window.electronAPI) {
      const updatedSkills = skills.map((s) => (s.id === skill.id ? { ...s, installed: true } : s));
      await window.electronAPI.writeSkills(JSON.stringify({ version: '1.0.0', lastUpdated: new Date().toISOString(), skills: updatedSkills }, null, 2));
    }
  }

  async function handleUninstall(skill: Skill) {
    uninstallSkill(skill.id);
    addNotification({
      type: 'info',
      title: 'Skill deinstalliert',
      message: `${skill.name} wurde entfernt.`,
    });

    if (window.electronAPI) {
      const updatedSkills = skills.map((s) => (s.id === skill.id ? { ...s, installed: false } : s));
      await window.electronAPI.writeSkills(JSON.stringify({ version: '1.0.0', lastUpdated: new Date().toISOString(), skills: updatedSkills }, null, 2));
    }
  }

  const categories = [...new Set(skills.map((s) => s.category))];
  const filteredSkills = skills.filter((s) => {
    const matchesText = !filter || s.name.toLowerCase().includes(filter.toLowerCase()) || s.tags.some((t) => t.includes(filter.toLowerCase()));
    const matchesCategory = !categoryFilter || s.category === categoryFilter;
    return matchesText && matchesCategory;
  });

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-af-text">Skill-Marktplatz</h2>
        <span className="text-xs text-af-muted">
          {skills.filter((s) => s.installed).length}/{skills.length} installiert
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Skills suchen..."
          className="bg-af-surface border border-af-border rounded-lg px-3 py-1.5 text-xs text-af-text placeholder-af-muted focus:outline-none focus:ring-1 focus:ring-af-accent"
        />
        <div className="flex gap-1">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${!categoryFilter ? 'bg-af-accent text-white' : 'text-af-muted hover:bg-af-surface'}`}
          >
            Alle
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${categoryFilter === cat ? 'bg-af-accent text-white' : 'text-af-muted hover:bg-af-surface'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredSkills.map((skill) => (
          <div key={skill.id} className="bg-af-surface border border-af-border rounded-xl p-4 hover:border-af-accent/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-af-text">{skill.name}</h3>
                <p className="text-[10px] text-af-muted mt-0.5">v{skill.version} - {skill.author}</p>
              </div>
              <span className="text-[10px] bg-af-dark text-af-muted px-1.5 py-0.5 rounded">{skill.category}</span>
            </div>
            <p className="text-xs text-af-muted mt-2 line-clamp-2">{skill.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {skill.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[9px] bg-af-dark text-af-muted px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-[9px] text-af-muted">
                {skill.compatibility.slice(0, 2).join(', ')}
              </div>
              <button
                onClick={() => skill.installed ? handleUninstall(skill) : handleInstall(skill)}
                className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${
                  skill.installed
                    ? 'bg-af-error/20 text-af-error hover:bg-af-error/30'
                    : 'bg-af-accent/20 text-af-accent hover:bg-af-accent/30'
                }`}
              >
                {skill.installed ? 'Deinstallieren' : 'Installieren'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillMarketplace;
