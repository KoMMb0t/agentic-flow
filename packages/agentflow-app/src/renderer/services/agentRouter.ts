import type { AFJPMessage, AFJPSender, AFJPReceiver, MessageType, MessageFormat, Priority } from '../types';

/**
 * AgentFlow JSON Protocol (AFJP) Router
 * Handles message routing between agents
 */
export class AgentRouter {
  private messageQueue: AFJPMessage[] = [];
  private listeners: Map<string, ((msg: AFJPMessage) => void)[]> = new Map();
  private routingTable: Map<string, string[]> = new Map();

  createMessage(
    sender: AFJPSender,
    receiver: AFJPReceiver,
    content: string,
    options: {
      type?: MessageType;
      format?: MessageFormat;
      priority?: Priority;
      tags?: string[];
      skillRequired?: string;
      via?: string[];
      fallback?: string[];
      timeoutMs?: number;
    } = {}
  ): AFJPMessage {
    return {
      version: '1.0',
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sender,
      receiver,
      message: {
        type: options.type || 'request',
        content,
        format: options.format || 'text',
        metadata: {
          priority: options.priority || 'medium',
          tags: options.tags || [],
          skill_required: options.skillRequired || '',
        },
      },
      routing: {
        via: options.via || [],
        fallback: options.fallback || [],
        timeout_ms: options.timeoutMs || 30000,
      },
    };
  }

  async route(message: AFJPMessage): Promise<void> {
    this.messageQueue.push(message);

    if (message.receiver.type === 'broadcast') {
      this.listeners.forEach((callbacks) => {
        callbacks.forEach((cb) => cb(message));
      });
    } else {
      const agentListeners = this.listeners.get(message.receiver.id);
      if (agentListeners) {
        agentListeners.forEach((cb) => cb(message));
      } else {
        for (const fallbackId of message.routing.fallback) {
          const fallbackListeners = this.listeners.get(fallbackId);
          if (fallbackListeners) {
            fallbackListeners.forEach((cb) => cb(message));
            break;
          }
        }
      }
    }
  }

  subscribe(agentId: string, callback: (msg: AFJPMessage) => void): () => void {
    if (!this.listeners.has(agentId)) {
      this.listeners.set(agentId, []);
    }
    this.listeners.get(agentId)!.push(callback);
    return () => {
      const callbacks = this.listeners.get(agentId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  registerRoute(agentId: string, capabilities: string[]): void {
    this.routingTable.set(agentId, capabilities);
  }

  findAgentsByCapability(capability: string): string[] {
    const agents: string[] = [];
    this.routingTable.forEach((caps, agentId) => {
      if (caps.includes(capability)) {
        agents.push(agentId);
      }
    });
    return agents;
  }

  getMessageHistory(): AFJPMessage[] {
    return [...this.messageQueue];
  }

  clearQueue(): void {
    this.messageQueue = [];
  }
}

export const agentRouter = new AgentRouter();
