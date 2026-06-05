import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { Send, Bot, ChevronDown, Circle } from 'lucide-react';

export const AgentPanel: React.FC = () => {
  const {
    agents,
    selectedAgentId,
    messages,
    isLoading,
    selectAgent,
    sendMessage,
    getSelectedAgent,
    getMessagesForAgent,
  } = useAgentStore();

  const [inputText, setInputText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedAgent = getSelectedAgent();
  const agentMessages = selectedAgentId ? getMessagesForAgent(selectedAgentId) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedAgentId) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Agent Selector */}
      <div className="relative mb-4">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-4 py-3 af-card cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {selectedAgent ? (
              <>
                <span className="text-2xl">{selectedAgent.icon}</span>
                <div className="text-left">
                  <p className="font-medium text-af-text">{selectedAgent.name}</p>
                  <p className="text-xs text-af-text-muted">{selectedAgent.description}</p>
                </div>
              </>
            ) : (
              <span className="text-af-text-muted">Agent auswählen...</span>
            )}
          </div>
          <ChevronDown size={18} className={`text-af-text-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 af-panel max-h-80 overflow-y-auto animate-slide-down">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  selectAgent(agent.id);
                  setShowDropdown(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-af-surface-light transition-colors
                  ${selectedAgentId === agent.id ? 'bg-af-primary/10 border-l-2 border-af-primary' : ''}`}
              >
                <span className="text-xl">{agent.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-af-text">{agent.name}</p>
                  <p className="text-xs text-af-text-muted">{agent.description}</p>
                </div>
                <Circle
                  size={8}
                  className={`${
                    agent.status === 'online' ? 'fill-green-400 text-green-400' :
                    agent.status === 'busy' ? 'fill-yellow-400 text-yellow-400' :
                    'fill-gray-500 text-gray-500'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {agentMessages.length === 0 && selectedAgent && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <Bot size={48} className="text-af-text-muted mb-3" />
            <p className="text-af-text-muted">
              Starte eine Konversation mit <strong>{selectedAgent.name}</strong>
            </p>
          </div>
        )}

        {!selectedAgent && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <Bot size={48} className="text-af-text-muted mb-3" />
            <p className="text-af-text-muted">Wähle einen Agenten aus, um zu beginnen</p>
          </div>
        )}

        {agentMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-af-primary text-white rounded-br-sm'
                  : 'bg-af-surface-light text-af-text rounded-bl-sm border border-af-border'
              }`}
            >
              {msg.content}
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-af-text-muted'}`}>
                {msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-af-surface-light border border-af-border rounded-xl px-4 py-3 rounded-bl-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-af-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-af-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-af-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedAgent ? `Nachricht an ${selectedAgent.name}...` : 'Zuerst einen Agenten auswählen...'}
          disabled={!selectedAgentId}
          className="af-input resize-none h-12 py-3"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || !selectedAgentId || isLoading}
          className="af-button-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AgentPanel;
