/**
 * Claude / Anthropic API Service
 *
 * Provides typed access to the Anthropic Messages API.
 * The API key is read from the VITE_CLAUDE_API_KEY environment variable
 * (set in .env – never committed to version control).
 *
 * NOTE: Calling the Anthropic API directly from a browser/renderer exposes
 * the API key to end-users. For production use, proxy requests through a
 * backend server that holds the key server-side.
 */

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;

// Default model – override per-call if needed.
export const DEFAULT_MODEL = 'claude-opus-4-5';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function headers(): HeadersInit {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
  if (API_KEY) {
    h['x-api-key'] = API_KEY;
  }
  return h;
}

async function antFetch<T>(
  path: string,
  body: unknown,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${ANTHROPIC_API_BASE}${path}`, {
    method: 'POST',
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic API error ${res.status} for ${path}: ${errBody}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant';

export interface ContentBlock {
  type: 'text';
  text: string;
}

export interface Message {
  role: MessageRole;
  content: string | ContentBlock[];
}

export interface SendMessageOptions {
  /** Model to use. Defaults to DEFAULT_MODEL. */
  model?: string;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Optional system prompt. */
  system?: string;
  /** Temperature (0–1). */
  temperature?: number;
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  usage: { input_tokens: number; output_tokens: number };
}

export interface StreamDelta {
  type: 'text_delta';
  text: string;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/**
 * Send a single user message and receive a complete response.
 *
 * @param userMessage  The user's message text.
 * @param history      Optional prior conversation turns for multi-turn chat.
 * @param options      Model / generation parameters.
 */
export async function sendMessage(
  userMessage: string,
  history: Message[] = [],
  options: SendMessageOptions = {},
): Promise<ClaudeResponse> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 1024,
    system,
    temperature,
  } = options;

  const messages: Message[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages,
  };
  if (system) body['system'] = system;
  if (temperature !== undefined) body['temperature'] = temperature;

  return antFetch<ClaudeResponse>('/messages', body);
}

/**
 * Extract the plain-text content from a ClaudeResponse.
 */
export function extractText(response: ClaudeResponse): string {
  return response.content
    .filter((b): b is ContentBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/**
 * Simple one-shot chat helper: sends a message and returns the text reply.
 *
 * @param userMessage  The user's message.
 * @param system       Optional system prompt.
 * @param options      Additional generation options.
 */
export async function chat(
  userMessage: string,
  system?: string,
  options: Omit<SendMessageOptions, 'system'> = {},
): Promise<string> {
  const response = await sendMessage(userMessage, [], { ...options, system });
  return extractText(response);
}

/**
 * Multi-turn conversation helper.
 * Maintains a mutable history array that callers can persist between calls.
 *
 * @param history      Mutable conversation history (modified in place).
 * @param userMessage  The new user message.
 * @param options      Generation options.
 * @returns            The assistant's reply text and the updated history.
 */
export async function continueConversation(
  history: Message[],
  userMessage: string,
  options: SendMessageOptions = {},
): Promise<{ reply: string; history: Message[] }> {
  const response = await sendMessage(userMessage, history, options);
  const reply = extractText(response);

  const updatedHistory: Message[] = [
    ...history,
    { role: 'user', content: userMessage },
    { role: 'assistant', content: reply },
  ];

  return { reply, history: updatedHistory };
}

/**
 * List available Claude models (static snapshot – update as Anthropic releases new models).
 */
export function listModels(): { id: string; name: string; description: string }[] {
  return [
    {
      id: 'claude-opus-4-5',
      name: 'Claude Opus 4.5',
      description: 'Most capable model for complex tasks',
    },
    {
      id: 'claude-sonnet-4-5',
      name: 'Claude Sonnet 4.5',
      description: 'Balanced performance and speed',
    },
    {
      id: 'claude-haiku-3-5',
      name: 'Claude Haiku 3.5',
      description: 'Fastest and most compact model',
    },
  ];
}
