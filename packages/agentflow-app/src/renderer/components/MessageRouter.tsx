import React from 'react';
import { agentRouter } from '../services/agentRouter';
import type { AFJPMessage } from '../types';

const MessageRouter: React.FC = () => {
  const [messages, setMessages] = React.useState<AFJPMessage[]>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessages(agentRouter.getMessageHistory());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-af-text">AFJP Message Router</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-af-muted">{messages.length} Nachrichten</span>
          <button
            onClick={() => {
              agentRouter.clearQueue();
              setMessages([]);
            }}
            className="text-[10px] text-af-muted hover:text-af-error px-2 py-1 rounded hover:bg-af-surface transition-colors"
          >
            Queue leeren
          </button>
        </div>
      </div>

      {/* Protocol Info */}
      <div className="bg-af-surface border border-af-border rounded-xl p-4">
        <h3 className="text-xs font-medium text-af-accent mb-2">AgentFlow JSON Protocol (AFJP) v1.0</h3>
        <div className="grid grid-cols-3 gap-3 text-[10px] text-af-muted">
          <div>
            <span className="text-af-text block mb-1">Sender Types</span>
            agent, user
          </div>
          <div>
            <span className="text-af-text block mb-1">Message Types</span>
            request, response, notification
          </div>
          <div>
            <span className="text-af-text block mb-1">Routing</span>
            via, fallback, timeout
          </div>
        </div>
      </div>

      {/* Message Log */}
      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-af-muted text-sm">
            <p>Keine Nachrichten im Router.</p>
            <p className="text-xs mt-1">Sende eine Nachricht im Multi-Agent Chat, um den Router zu aktivieren.</p>
          </div>
        ) : (
          messages.slice().reverse().map((msg) => (
            <div key={msg.id} className="bg-af-surface border border-af-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    msg.message.type === 'request' ? 'bg-blue-500/20 text-blue-400' :
                    msg.message.type === 'response' ? 'bg-green-500/20 text-green-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {msg.message.type}
                  </span>
                  <span className="text-[10px] text-af-muted">
                    {msg.sender.name} → {msg.receiver.name}
                  </span>
                </div>
                <span className="text-[9px] text-af-muted">
                  {new Date(msg.timestamp).toLocaleTimeString('de-DE')}
                </span>
              </div>
              <p className="text-xs text-af-text truncate">{msg.message.content}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[9px] px-1 rounded ${
                  msg.message.metadata.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  msg.message.metadata.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {msg.message.metadata.priority}
                </span>
                <span className="text-[9px] text-af-muted">ID: {msg.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageRouter;
