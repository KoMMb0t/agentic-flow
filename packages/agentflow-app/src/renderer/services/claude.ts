interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateDocumentation(input: string, type: 'repo' | 'code' | 'api'): Promise<string> {
  const systemPrompt = getSystemPrompt(type);

  if (window.electronAPI) {
    const messages: ClaudeMessage[] = [{ role: 'user', content: input }];
    const result = await window.electronAPI.chatWithClaude(messages, systemPrompt);

    if (result.error) {
      throw new Error(result.error);
    }

    const textContent = result.data?.content
      ?.filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n') || 'Keine Dokumentation generiert.';

    return textContent;
  }

  throw new Error('Electron API nicht verfügbar. Bitte die Desktop-App verwenden.');
}

function getSystemPrompt(type: 'repo' | 'code' | 'api'): string {
  switch (type) {
    case 'repo':
      return `Du bist ein technischer Dokumentations-Experte. Generiere eine umfassende README.md Dokumentation für das gegebene Repository. 
Inkludiere: Projektbeschreibung, Installation, Nutzung, API-Referenz (falls relevant), Architektur-Überblick, und Contributing Guidelines.
Formatiere alles in sauberem Markdown mit passenden Headern, Code-Blöcken und Tabellen.`;
    case 'code':
      return `Du bist ein Code-Dokumentations-Experte. Analysiere den gegebenen Code und generiere detaillierte Dokumentation.
Inkludiere: Funktionsbeschreibungen, Parameter-Dokumentation, Rückgabewerte, Beispiele, und Architektur-Notizen.
Formatiere alles in sauberem Markdown.`;
    case 'api':
      return `Du bist ein API-Dokumentations-Experte. Generiere eine vollständige API-Dokumentation basierend auf dem Input.
Inkludiere: Endpoints, Request/Response Schemas, Authentifizierung, Fehlerbehandlung, und Beispiel-Requests (curl + JavaScript).
Formatiere alles in sauberem Markdown mit Tabellen für Parameter.`;
    default:
      return 'Du bist ein technischer Dokumentations-Experte. Generiere klare, umfassende Dokumentation in Markdown.';
  }
}

export async function improveDocumentation(existingDoc: string, feedback: string): Promise<string> {
  if (window.electronAPI) {
    const messages = [
      {
        role: 'user' as const,
        content: `Bestehende Dokumentation:\n\n${existingDoc}\n\nFeedback/Anweisungen:\n${feedback}`,
      },
    ];
    const systemPrompt = 'Du bist ein Dokumentations-Editor. Verbessere die gegebene Dokumentation basierend auf dem Feedback. Behalte das Markdown-Format bei.';
    const result = await window.electronAPI.chatWithClaude(messages, systemPrompt);

    if (result.error) {
      throw new Error(result.error);
    }

    return result.data?.content?.[0]?.text || existingDoc;
  }

  throw new Error('Electron API nicht verfügbar');
}
