import React, { useState, useEffect } from 'react';
import { generateDocumentation } from '../services/claude';
import { getRepos, getRepoContent, getFileContent } from '../services/github';
import type { GitHubRepo } from '../types';

type DocType = 'repo' | 'code' | 'api';

const DocsGenerator: React.FC = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocType>('repo');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRepos().then(setRepos).catch(console.error);
  }, []);

  async function handleGenerate() {
    if (!input.trim() && !selectedRepo) return;
    setIsGenerating(true);
    setError(null);
    setOutput('');

    try {
      let content = input;

      if (selectedRepo && !input.trim()) {
        const repoData = repos.find((r) => r.name === selectedRepo);
        const files = await getRepoContent(selectedRepo).catch(() => []);
        content = `Repository: ${selectedRepo}\n`;
        content += `Beschreibung: ${repoData?.description || 'Keine Beschreibung'}\n`;
        content += `Sprache: ${repoData?.language || 'Unbekannt'}\n`;
        content += `Topics: ${repoData?.topics?.join(', ') || 'Keine'}\n\n`;
        content += `Dateien im Root:\n${files.map((f: any) => `- ${f.name} (${f.type})`).join('\n')}\n`;

        try {
          const readme = await getFileContent(selectedRepo, 'README.md');
          content += `\nAktuelle README:\n${readme.substring(0, 2000)}`;
        } catch {}
      } else if (selectedRepo && input.trim()) {
        content = `Repository: ${selectedRepo}\n\n${input}`;
      }

      const result = await generateDocumentation(content, docType);
      setOutput(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(output);
  }

  function downloadMarkdown() {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedRepo || 'documentation'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold text-af-text">Dokumentations-Generator</h2>

      {/* Config */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedRepo || ''}
            onChange={(e) => setSelectedRepo(e.target.value || null)}
            className="bg-af-dark border border-af-border rounded-lg px-3 py-1.5 text-xs text-af-text"
          >
            <option value="">Repository wählen...</option>
            {repos.map((r) => (
              <option key={r.name} value={r.name}>{r.name}</option>
            ))}
          </select>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="bg-af-dark border border-af-border rounded-lg px-3 py-1.5 text-xs text-af-text"
          >
            <option value="repo">README / Repo-Doku</option>
            <option value="code">Code-Dokumentation</option>
            <option value="api">API-Dokumentation</option>
          </select>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Optional: Zusätzlicher Kontext oder Code einfügen..."
          className="w-full bg-af-dark border border-af-border rounded-lg px-3 py-2 text-sm text-af-text placeholder-af-muted resize-none focus:outline-none focus:ring-1 focus:ring-af-accent"
          rows={4}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || (!input.trim() && !selectedRepo)}
          className="text-xs bg-af-accent hover:bg-af-accent-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isGenerating ? 'Generiere...' : 'Dokumentation generieren'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-af-error/10 border border-af-error/30 rounded-lg p-3 text-xs text-af-error">
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="bg-af-surface border border-af-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-af-text">Generierte Dokumentation</h3>
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="text-[10px] text-af-muted hover:text-af-accent px-2 py-1 rounded hover:bg-af-dark transition-colors">
                Kopieren
              </button>
              <button onClick={downloadMarkdown} className="text-[10px] text-af-muted hover:text-af-accent px-2 py-1 rounded hover:bg-af-dark transition-colors">
                Download .md
              </button>
            </div>
          </div>
          <pre className="text-xs text-af-text whitespace-pre-wrap overflow-y-auto max-h-96 bg-af-dark rounded-lg p-3 border border-af-border">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DocsGenerator;
