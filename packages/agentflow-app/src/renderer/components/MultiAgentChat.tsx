import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { chatService } from '../services/chatService';
import type { ChatMessage } from '../types';

const MultiAgentChat: React.FC = () => {
  const { agents, sessions, activeSessionId, addMessage, createSession, setActiveSession, isLoading, setLoading } = useAppStore();
  const [input, setInput] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['claude']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = createSession('Chat ' + new Date().toLocaleTimeString('de-DE'), selectedAgents);
    }

    addMessage(sessionId, {
      agentId: 'user',
      agentName: 'User',
      content: userMessage,
      format: 'text',
      isUser: true,
      isSimulated: false,
    });

    setLoading(true);

    for (const agentId of selectedAgents) {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) continue;

      try {
        const currentSession = useAppStore.getState().sessions.find((s) => s.id === sessionId);
        const response = await chatService.sendToAgent(agent, userMessage, currentSession?.messages || []);

        addMessage(sessionId!, {
          agentId: response.agentId,
          agentName: response.agentName,
          content: response.content,
          format: response.format,
          isUser: false,
          isSimulated: response.isSimulated,
          afjpMessage: response.afjpMessage,
        });
      } catch (error: any) {
        addMessage(sessionId!, {
          agentId,
          agentName: agent.name,
          content: `⚠️ Fehler: ${error.message}`,
          format: 'text',
          isUser: false,
          isSimulated: true,
        });
      }
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Agent Selector */}
      <div className="shrink-0 px-4 py-3 border-b border-af-border bg-af-dark/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-af-muted uppercase tracking-wider">Agenten:</span>
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all ${
                selectedAgents.includes(agent.id)
                  ? 'ring-1 ring-opacity-50 bg-opacity-20'
                  : 'opacity-50 hover:opacity-80'
              }`}
              style={{
                backgroundColor: selectedAgents.includes(agent.id) ? `${agent.color}20` : undefined,
                borderColor: agent.color,
                outlineColor: agent.color,
              }}
            >
              <span>{agent.avatar}</span>
              <span className="text-af-text">{agent.name}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                agent.status === 'online' ? 'bg-af-success' :
                agent.status === 'not_configured' ? 'bg-af-warning' : 'bg-af-error'
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeSession?.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} agents={agents} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-af-muted text-xs">
            <div className="animate-pulse">●</div>
            <span>Agenten antworten...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-af-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht an Agenten senden..."
            className="flex-1 bg-af-surface border border-af-border rounded-lg px-3 py-2 text-sm text-af-text placeholder-af-muted resize-none focus:outline-none focus:ring-1 focus:ring-af-accent"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Senden
          </button>
        </div>
      </div>

      {/* Session List */}
      {sessions.length > 1 && (
        <div className="shrink-0 px-4 py-2 border-t border-af-border bg-af-dark/30">
          <div className="flex gap-1 overflow-x-auto">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${
                  s.id === activeSessionId
                    ? 'bg-af-accent/20 text-af-accent'
                    : 'text-af-muted hover:text-af-text hover:bg-af-surface'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MessageBubble: React.FC<{ message: ChatMessage; agents: any[] }> = ({ message, agents }) => {
  const agent = agents.find((a) => a.id === message.agentId);
  const isUser = message.isUser;

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
        isUser ? 'bg-af-accent/20' : 'bg-af-surface'
      }`}>
        {isUser ? '👤' : agent?.avatar || '🤖'}
      </div>
      <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
        isUser
          ? 'bg-af-accent/20 border border-af-accent/30'
          : message.isSimulated
            ? 'bg-af-surface border border-af-border opacity-80'
            : 'bg-af-surface border border-af-border'
      }`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-medium" style={{ color: agent?.color }}>
              {message.agentName}
            </span>
            {message.isSimulated && (
              <span className="text-[9px] bg-af-warning/20 text-af-warning px-1 rounded">simuliert</span>
            )}
          </div>
        )}
        <p className="text-xs text-af-text whitespace-pre-wrap">{message.content}</p>
        <span className="text-[9px] text-af-muted mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString('de-DE')}
        </span>
      </div>
    </div>
  );
};

export default MultiAgentChat;
