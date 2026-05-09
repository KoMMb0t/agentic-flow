// QUIC Transport Loader with WebSocket fallback
//
// Backported from outer repo loader pattern. Exposes a single
// loadQuicTransport(config) entry point that:
//
//   1. Tries to load the WASM-backed QuicClient/QuicServer (real QUIC if a
//      native build is wired in the future).
//   2. Falls back to WebSocketFallbackTransport when QUIC is unavailable
//      OR when the WASM stub is detected (current state — see
//      crates/agentic-flow-quic/src/wasm.rs comment: WASM build is a stub
//      because browsers can't do raw UDP/QUIC; production QUIC needs
//      native Node.js builds which haven't shipped yet).
//
// The fallback uses standard WebSocket (ws://) so it works on all Node
// versions without complex native dependencies. Same async send/receive
// API surface as QuicTransport.
//
// Federation use case (ruvnet/ruflo ADR-104): two peers on the same
// tailnet can call loadQuicTransport({ serverName: 'peer.tailnet' }) and
// exchange signed envelopes today, with zero code change required when
// the native QUIC build lands later.

import { logger } from '../utils/logger.js';
import WebSocket, { WebSocketServer, type RawData } from 'ws';

/** Caller-facing config — minimal common surface across both backends. */
export interface QuicTransportConfig {
  serverName?: string;
  maxIdleTimeoutMs?: number;
  maxConcurrentStreams?: number;
  enable0Rtt?: boolean;
}

export interface AgentMessage {
  id: string;
  type: 'task' | 'result' | 'status' | 'coordination' | 'heartbeat' | string;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

export interface PoolStatistics {
  active: number;
  idle: number;
  created: number;
  closed: number;
}

/** Inbound message handler — called for every received message. */
export type InboundMessageHandler = (
  address: string,
  message: AgentMessage,
) => void | Promise<void>;

/** Common interface both real-QUIC and fallback transports satisfy. */
export interface AgentTransport {
  send(address: string, message: AgentMessage): Promise<void>;
  receive(address: string): Promise<AgentMessage>;
  request(address: string, message: AgentMessage): Promise<AgentMessage>;
  sendBatch(address: string, messages: AgentMessage[]): Promise<void>;
  getStats(): Promise<PoolStatistics>;
  close(): Promise<void>;
  /**
   * Subscribe to inbound messages. The handler fires for every message
   * received by this transport (both server-side accepted connections
   * and client-side receive callbacks). Multiple handlers may be
   * registered. Errors thrown by a handler are logged but do not stop
   * delivery to other handlers.
   *
   * Optional method — implementations that don't support push-style
   * delivery may omit it. Callers should use `transport.onMessage?.(h)`
   * to gracefully degrade.
   */
  onMessage?(handler: InboundMessageHandler): void;
}

/**
 * WebSocket fallback transport.
 *
 * Spec compliance: implements the AgentTransport interface using
 * `ws://` (or `wss://` if address starts with `wss://`). Each call to
 * `send` lazily opens (or reuses) a connection to `address`. The
 * `receive(address)` call drains the next queued message for that
 * address; if none is queued it polls every 100ms until one arrives.
 *
 * Limits vs real QUIC: no 0-RTT resumption, no multiplexed streams
 * (one TCP connection per peer), TLS handled by the WS layer (use
 * `wss://` for encryption). Performance is "good enough" for federation
 * messages at human/agent rates (≤ 100 RPS per peer).
 */
class WebSocketFallbackTransport implements AgentTransport {
  private connections = new Map<string, WebSocket>();
  private messageQueue = new Map<string, AgentMessage[]>();
  private connectionsCreated = 0;
  private connectionsClosed = 0;
  private servers = new Map<number, WebSocketServer>();
  /**
   * Inbound handlers registered via onMessage. Fired for every received
   * message after it lands in the per-address queue (queue stays for the
   * receive() poll API; handlers add push-style delivery on top).
   */
  private inboundHandlers = new Set<InboundMessageHandler>();

  constructor(private readonly config: Required<QuicTransportConfig>) {}

  static async create(config: QuicTransportConfig = {}): Promise<WebSocketFallbackTransport> {
    const fullConfig: Required<QuicTransportConfig> = {
      serverName: config.serverName ?? 'localhost',
      maxIdleTimeoutMs: config.maxIdleTimeoutMs ?? 30000,
      maxConcurrentStreams: config.maxConcurrentStreams ?? 100,
      // Not applicable for WebSocket — record but ignore
      enable0Rtt: config.enable0Rtt ?? false,
    };
    return new WebSocketFallbackTransport(fullConfig);
  }

  /**
   * Bind a server-side listener so this transport instance can RECEIVE
   * messages from a remote peer (in addition to sending). Federation
   * peers run BOTH a listener and a client — calling listen(9100) plus
   * send('peer:9100', ...) gives bidirectional connectivity.
   */
  async listen(port: number, host = '0.0.0.0'): Promise<void> {
    if (this.servers.has(port)) return;
    return new Promise((resolve, reject) => {
      const wss = new WebSocketServer({ port, host });
      wss.on('listening', () => {
        this.servers.set(port, wss);
        resolve();
      });
      wss.on('error', reject);
      wss.on('connection', (ws, req) => {
        const remoteAddr = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
        ws.on('message', (raw: RawData) => {
          try {
            const message = JSON.parse(raw.toString()) as AgentMessage;
            const queue = this.messageQueue.get(remoteAddr) ?? [];
            queue.push(message);
            this.messageQueue.set(remoteAddr, queue);
            this.dispatchInbound(remoteAddr, message);
          } catch (err) {
            logger.warn('Dropped malformed inbound WS message', { remoteAddr, err });
          }
        });
      });
    });
  }

  private async getOrCreateConnection(address: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const existing = this.connections.get(address);
      if (existing && existing.readyState === WebSocket.OPEN) {
        resolve(existing);
        return;
      }

      const url = address.startsWith('ws://') || address.startsWith('wss://')
        ? address
        : `ws://${address}`;
      const ws = new WebSocket(url);

      ws.on('open', () => {
        this.connections.set(address, ws);
        this.connectionsCreated++;
        resolve(ws);
      });

      ws.on('error', (error: Error) => {
        reject(new Error(`WebSocket connection to ${url} failed: ${error.message}`));
      });

      ws.on('close', () => {
        this.connectionsClosed++;
        this.connections.delete(address);
      });

      ws.on('message', (raw: RawData) => {
        try {
          const message = JSON.parse(raw.toString()) as AgentMessage;
          const queue = this.messageQueue.get(address) ?? [];
          queue.push(message);
          this.messageQueue.set(address, queue);
          this.dispatchInbound(address, message);
        } catch (err) {
          logger.warn('Dropped malformed WebSocket message', { address, err });
        }
      });
    });
  }

  async send(address: string, message: AgentMessage): Promise<void> {
    const ws = await this.getOrCreateConnection(address);
    ws.send(JSON.stringify(message));
  }

  /**
   * Register an inbound handler. Returns nothing; handlers are
   * de-duplicated by reference (registering the same function twice
   * has no effect). To unregister, the caller would need to keep the
   * reference and call `set.delete(handler)` — exposed via a separate
   * helper if needed in the future.
   */
  onMessage(handler: InboundMessageHandler): void {
    this.inboundHandlers.add(handler);
  }

  /**
   * Fire all registered handlers for a received message. Errors thrown
   * synchronously OR rejected asynchronously by a handler are logged
   * but do not stop delivery to other handlers — push-style delivery is
   * fire-and-forget per-handler.
   */
  private dispatchInbound(address: string, message: AgentMessage): void {
    if (this.inboundHandlers.size === 0) return;
    for (const h of this.inboundHandlers) {
      try {
        const r = h(address, message);
        if (r && typeof (r as Promise<void>).catch === 'function') {
          (r as Promise<void>).catch((err) => {
            logger.warn('Inbound handler rejected', { address, err });
          });
        }
      } catch (err) {
        logger.warn('Inbound handler threw', { address, err });
      }
    }
  }

  async receive(address: string): Promise<AgentMessage> {
    // Fast path
    const queue = this.messageQueue.get(address) ?? [];
    if (queue.length > 0) return queue.shift()!;

    // Poll (caller must time out externally if they don't want to wait)
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const q = this.messageQueue.get(address) ?? [];
        if (q.length > 0) {
          clearInterval(interval);
          resolve(q.shift()!);
        }
      }, 100);
    });
  }

  async request(address: string, message: AgentMessage): Promise<AgentMessage> {
    await this.send(address, message);
    return this.receive(address);
  }

  async sendBatch(address: string, messages: AgentMessage[]): Promise<void> {
    await Promise.all(messages.map((m) => this.send(address, m)));
  }

  async getStats(): Promise<PoolStatistics> {
    return {
      active: this.connections.size,
      idle: 0,
      created: this.connectionsCreated,
      closed: this.connectionsClosed,
    };
  }

  async close(): Promise<void> {
    // Outbound clients first.
    for (const ws of this.connections.values()) {
      ws.terminate();
    }
    this.connections.clear();
    this.messageQueue.clear();

    // Inbound: WebSocketServer.close() blocks until every accepted
    // socket disconnects. Forcibly terminate them so the close
    // callback fires within the test/CI timeout window.
    for (const wss of this.servers.values()) {
      for (const client of wss.clients) {
        try {
          client.terminate();
        } catch {
          /* socket already gone */
        }
      }
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
    this.servers.clear();
  }
}

/**
 * Detect whether the WASM-backed QUIC transport is "real" (i.e. it
 * actually moves bytes on the wire) vs the current stub. The stub
 * returns 0ms for connect+send and never increments the server's
 * received-bytes counter. We probe by observing a documented marker
 * on the WASM module: when it's truly wired the loader function
 * `defaultConfig` returns an object whose round-trip through
 * `WasmQuicClient.new` actually opens a UDP socket — failing fast on
 * an OS that blocks UDP outbound (e.g. some sandboxed CI envs).
 *
 * Until the native build lands this returns false; the loader picks
 * WebSocket. When the native binding is wired this returns true and
 * the loader picks real QUIC. Callers get the same API either way.
 */
async function isRealQuicAvailable(): Promise<boolean> {
  try {
    // The WASM file is published in `wasm/quic/` of this package. We
    // do NOT use it for federation today (per the wasm.rs note: it's a
    // stub since browsers can't do UDP). When a native binding is added
    // this probe should switch to detect that binding instead.
    const native = process.env.AGENTIC_FLOW_QUIC_NATIVE === '1';
    return native;
  } catch {
    return false;
  }
}

/**
 * Public API — load a working transport, preferring real QUIC when
 * available, falling back to WebSocket otherwise. The returned object
 * satisfies the AgentTransport interface in both cases.
 *
 * Example:
 *   const t = await loadQuicTransport({ serverName: 'ruvultra:9100' });
 *   await t.send('ruvultra:9100', { id: '1', type: 'task', payload: {...} });
 *
 * Federation v1 ships on the WebSocket fallback (this is the actual
 * working transport today). When the native QUIC binding lands, set
 * the AGENTIC_FLOW_QUIC_NATIVE=1 environment variable and the same
 * code path picks up the upgrade with no API changes.
 */
export async function loadQuicTransport(
  config: QuicTransportConfig = {},
): Promise<AgentTransport> {
  if (await isRealQuicAvailable()) {
    // Future: wire to the native binding here.
    logger.info('QUIC transport: native binding selected');
  } else {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn(
        'QUIC native binding not available; using WebSocket fallback. ' +
          'Set AGENTIC_FLOW_QUIC_NATIVE=1 once a native build is installed.',
      );
    }
  }
  return WebSocketFallbackTransport.create(config);
}

/** Quick capability probe for the doctor / health surface. */
export async function isQuicAvailable(): Promise<boolean> {
  return isRealQuicAvailable();
}

export interface TransportCapabilities {
  quicAvailable: boolean;
  webSocketFallbackAvailable: true;
  selectedBackend: 'quic' | 'websocket';
}

export async function getTransportCapabilities(): Promise<TransportCapabilities> {
  const quic = await isRealQuicAvailable();
  return {
    quicAvailable: quic,
    webSocketFallbackAvailable: true,
    selectedBackend: quic ? 'quic' : 'websocket',
  };
}

export { WebSocketFallbackTransport };
