import type { Agent, ChatMessage, MessageFormat, AFJPMessage } from '../types';
import { agentRouter } from './agentRouter';
import { getSimulatedResponse } from './agentRegistry';

interface ChatResponse {
  agentId: string;
  agentName: string;
  content: string;
  format: MessageFormat;
  isSimulated: boolean;
  afjpMessage?: AFJPMessage;
}

class ChatService {
  async sendToAgent(
    agent: Agent,
    userMessage: string,
    history: ChatMessage[]
  ): Promise<ChatResponse> {
    // Create AFJP message for routing
    const afjpMessage = agentRouter.createMessage(
      { type: 'user', id: 'user', name: 'User' },
      { type: 'agent', id: agent.id, name: agent.name },
      userMessage,
      { type: 'request', format: 'text', priority: 'medium' }
    );

    await agentRouter.route(afjpMessage);

    if (agent.id === 'claude' && agent.isReal) {
      return this.sendToClaude(agent, userMessage, history, afjpMessage);
    } else {
      return this.getSimulatedResponse(agent, userMessage, afjpMessage);
    }
  }

  private async sendToClaude(
    agent: Agent,
    userMessage: string,
    history: ChatMessage[],
    afjpMessage: AFJPMessage
  ): Promise<ChatResponse> {
    // Build message history for Claude
    const messages = history
      .filter((m) => !m.isSimulated || m.agentId === 'claude')
      .slice(-10)
      .map((m) => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.content,
      }));

    messages.push({ role: 'user', content: userMessage });

    const systemPrompt = `Du bist Claude, ein KI-Assistent in der AgentFlow Desktop-App. Du arbeitest zusammen mit anderen Agenten (GPT-4, Gemini, Mistral, Llama 3) in einem Multi-Agent-System. Antworte hilfreich, präzise und auf Deutsch wenn der User Deutsch schreibt.`;

    if (window.electronAPI) {
      const result = await window.electronAPI.chatWithClaude(messages, systemPrompt);

      if (result.error) {
        return {
          agentId: agent.id,
          agentName: agent.name,
          content: `⚠️ Claude API Fehler: ${result.error}`,
          format: 'text',
          isSimulated: false,
          afjpMessage,
        };
      }

      const textContent = result.data?.content
        ?.filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n') || 'Keine Antwort erhalten.';

      return {
        agentId: agent.id,
        agentName: agent.name,
        content: textContent,
        format: 'markdown',
        isSimulated: false,
        afjpMessage,
      };
    }

    // Browser fallback
    return {
      agentId: agent.id,
      agentName: agent.name,
      content: '[Claude] Electron API nicht verfügbar. Bitte die Desktop-App verwenden.',
      format: 'text',
      isSimulated: true,
      afjpMessage,
    };
  }

  private async getSimulatedResponse(
    agent: Agent,
    userMessage: string,
    afjpMessage: AFJPMessage
  ): Promise<ChatResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    const content = getSimulatedResponse(agent, userMessage);

    return {
      agentId: agent.id,
      agentName: agent.name,
      content,
      format: 'text',
      isSimulated: true,
      afjpMessage,
    };
  }
}

export const chatService = new ChatService();
