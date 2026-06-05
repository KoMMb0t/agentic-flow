import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { createIssue, closeIssue, getRepos } from '../services/github';
import type { GitHubRepo, Task, TaskPriority } from '../types';

const AGENTS = ['Claude', 'GPT-4', 'Gemini', 'Codex', 'Custom Agent'];

const TaskManager: React.FC = () => {
  const { tasks, addTask, deleteTask, updateTaskStatus } = useAppStore();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignedAgent: null as string | null,
    githubRepo: null as string | null,
    syncToGithub: false,
  });

  useEffect(() => {
    getRepos().then(setRepos).catch(console.error);
  }, []);

  async function handleCreateTask() {
    if (!newTask.title.trim()) return;
    let githubIssueNumber: number | null = null;

    if (newTask.syncToGithub && newTask.githubRepo) {
      try {
        const issue = await createIssue(
          newTask.githubRepo,
          newTask.title,
          `${newTask.description}\n\n---\n*Erstellt via AgentFlow Desktop*\n*Agent: ${newTask.assignedAgent || 'Nicht zugewiesen'}*`
        );
        githubIssueNumber = issue.number;
      } catch (err: any) {
        console.error('Failed to create GitHub issue:', err);
      }
    }

    addTask({
      title: newTask.title,
      description: newTask.description,
      status: 'open',
      priority: newTask.priority,
      assignedAgent: newTask.assignedAgent,
      githubIssueNumber,
      githubRepo: newTask.githubRepo,
    });

    setNewTask({ title: '', description: '', priority: 'medium', assignedAgent: null, githubRepo: null, syncToGithub: false });
    setShowNewTask(false);
  }

  async function handleCloseTask(task: Task) {
    if (task.githubIssueNumber && task.githubRepo) {
      try {
        await closeIssue(task.githubRepo, task.githubIssueNumber);
      } catch (err) {
        console.error('Failed to close GitHub issue:', err);
      }
    }
    updateTaskStatus(task.id, 'done');
  }

  const openTasks = tasks.filter((t) => t.status === 'open');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const priorityColor = (p: TaskPriority) =>
    p === 'high' ? 'text-af-error' : p === 'medium' ? 'text-af-warning' : 'text-af-muted';

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-af-text">Aufgabenverwaltung</h2>
        <button
          onClick={() => setShowNewTask(true)}
          className="text-xs bg-af-accent hover:bg-af-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          + Neue Aufgabe
        </button>
      </div>

      {/* New Task Form */}
      {showNewTask && (
        <div className="bg-af-surface border border-af-accent/30 rounded-xl p-4 space-y-3">
          <input
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Aufgabentitel..."
            className="w-full bg-af-dark border border-af-border rounded-lg px-3 py-2 text-sm text-af-text placeholder-af-muted focus:outline-none focus:ring-1 focus:ring-af-accent"
          />
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Beschreibung..."
            className="w-full bg-af-dark border border-af-border rounded-lg px-3 py-2 text-sm text-af-text placeholder-af-muted resize-none focus:outline-none focus:ring-1 focus:ring-af-accent"
            rows={2}
          />
          <div className="flex gap-3 flex-wrap">
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
              className="bg-af-dark border border-af-border rounded-lg px-2 py-1 text-xs text-af-text"
            >
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
            <select
              value={newTask.assignedAgent || ''}
              onChange={(e) => setNewTask({ ...newTask, assignedAgent: e.target.value || null })}
              className="bg-af-dark border border-af-border rounded-lg px-2 py-1 text-xs text-af-text"
            >
              <option value="">Kein Agent</option>
              {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={newTask.githubRepo || ''}
              onChange={(e) => setNewTask({ ...newTask, githubRepo: e.target.value || null })}
              className="bg-af-dark border border-af-border rounded-lg px-2 py-1 text-xs text-af-text"
            >
              <option value="">Kein Repo</option>
              {repos.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
            <label className="flex items-center gap-1 text-xs text-af-muted">
              <input
                type="checkbox"
                checked={newTask.syncToGithub}
                onChange={(e) => setNewTask({ ...newTask, syncToGithub: e.target.checked })}
                className="rounded"
              />
              GitHub Issue erstellen
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateTask} className="text-xs bg-af-accent text-white px-3 py-1.5 rounded-lg">
              Erstellen
            </button>
            <button onClick={() => setShowNewTask(false)} className="text-xs text-af-muted hover:text-af-text px-3 py-1.5">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Task Columns */}
      <div className="grid grid-cols-3 gap-4">
        <TaskColumn title="Offen" tasks={openTasks} priorityColor={priorityColor} onClose={handleCloseTask} onProgress={(t) => updateTaskStatus(t.id, 'in_progress')} onDelete={deleteTask} />
        <TaskColumn title="In Bearbeitung" tasks={inProgressTasks} priorityColor={priorityColor} onClose={handleCloseTask} onDelete={deleteTask} />
        <TaskColumn title="Erledigt" tasks={doneTasks} priorityColor={priorityColor} onDelete={deleteTask} />
      </div>
    </div>
  );
};

const TaskColumn: React.FC<{
  title: string;
  tasks: Task[];
  priorityColor: (p: TaskPriority) => string;
  onClose?: (t: Task) => void;
  onProgress?: (t: Task) => void;
  onDelete: (id: string) => void;
}> = ({ title, tasks, priorityColor, onClose, onProgress, onDelete }) => (
  <div>
    <h3 className="text-xs font-medium text-af-muted uppercase tracking-wider mb-2">
      {title} ({tasks.length})
    </h3>
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="bg-af-surface border border-af-border rounded-lg p-3">
          <div className="flex items-start justify-between">
            <h4 className="text-xs font-medium text-af-text">{task.title}</h4>
            <span className={`text-[10px] ${priorityColor(task.priority)}`}>{task.priority}</span>
          </div>
          {task.description && <p className="text-[10px] text-af-muted mt-1 line-clamp-2">{task.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            {task.assignedAgent && (
              <span className="text-[9px] bg-af-accent/20 text-af-accent px-1.5 py-0.5 rounded">{task.assignedAgent}</span>
            )}
            {task.githubIssueNumber && (
              <span className="text-[9px] bg-af-dark text-af-muted px-1.5 py-0.5 rounded">#{task.githubIssueNumber}</span>
            )}
          </div>
          <div className="flex gap-1 mt-2">
            {onProgress && task.status === 'open' && (
              <button onClick={() => onProgress(task)} className="text-[9px] text-af-accent hover:underline">Start</button>
            )}
            {onClose && task.status !== 'done' && (
              <button onClick={() => onClose(task)} className="text-[9px] text-af-success hover:underline">Erledigt</button>
            )}
            <button onClick={() => onDelete(task.id)} className="text-[9px] text-af-error hover:underline ml-auto">Löschen</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TaskManager;
