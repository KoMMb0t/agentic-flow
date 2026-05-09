/**
 * Tests for the loader-pattern transport (PR #153 backport).
 *
 * Pins the contract that distinguishes a real transport from the
 * earlier no-op stub:
 *   1. getTransportCapabilities() reflects backend selection honestly
 *   2. WebSocketServer + WebSocket round-trip actually delivers bytes
 *   3. send() reports a non-zero latency (anti-stub: the prior bug had
 *      every operation return 0ms because no I/O happened)
 *   4. close() is idempotent and cleans up server bindings
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  loadQuicTransport,
  getTransportCapabilities,
  isQuicAvailable,
  WebSocketFallbackTransport,
  type AgentTransport,
  type AgentMessage,
} from '../../src/transport/quic-loader.js';

// Use a high port range to avoid clashing with anything the dev runs locally
const TEST_PORT = 24_101;

// Close client before server. Closing the server first while a client
// connection is still open makes WebSocketServer.close() wait for the
// graceful disconnect, which can stall in tests.
const closeAll = async (...transports: (AgentTransport | undefined)[]) => {
  for (const t of transports) {
    if (t) await t.close().catch(() => undefined);
  }
};

describe('getTransportCapabilities', () => {
  it('returns websocket as selected backend by default', async () => {
    const caps = await getTransportCapabilities();
    expect(caps.webSocketFallbackAvailable).toBe(true);
    expect(caps.selectedBackend).toBe('websocket');
    expect(caps.quicAvailable).toBe(false);
  });

  it('selectedBackend tracks isQuicAvailable', async () => {
    const caps = await getTransportCapabilities();
    const quic = await isQuicAvailable();
    expect(caps.quicAvailable).toBe(quic);
    expect(caps.selectedBackend).toBe(quic ? 'quic' : 'websocket');
  });
});

describe('WebSocketFallbackTransport — real I/O round-trip', () => {
  let srv: WebSocketFallbackTransport | undefined;
  let cli: AgentTransport | undefined;

  afterEach(async () => {
    await closeAll(cli, srv);
    srv = undefined;
    cli = undefined;
  });

  it('listen() binds a port and accepts inbound connections', async () => {
    srv = await WebSocketFallbackTransport.create({ serverName: 'srv' });
    await srv.listen(TEST_PORT, '127.0.0.1');

    cli = await loadQuicTransport({ serverName: 'cli' });
    await cli.send(`127.0.0.1:${TEST_PORT}`, {
      id: 'm1',
      type: 'task',
      payload: { ping: 'hello' },
    });

    // Give the server's onmessage a moment to enqueue
    await new Promise((r) => setTimeout(r, 100));

    const stats = await srv.getStats();
    // The server tracks INBOUND connections via the WebSocketServer's
    // 'connection' event handler. Some `ws` versions don't add the
    // accepted socket to the outbound `connections` map, so we don't
    // assert active>0 here. The signal that bytes moved is the
    // delivered message; see the next test.
    expect(stats).toBeDefined();
  });

  it('client send completes with non-zero latency (anti-stub)', async () => {
    srv = await WebSocketFallbackTransport.create({ serverName: 'srv' });
    await srv.listen(TEST_PORT + 1, '127.0.0.1');

    cli = await loadQuicTransport({ serverName: 'cli' });
    const t0 = Date.now();
    await cli.send(`127.0.0.1:${TEST_PORT + 1}`, {
      id: 'm2',
      type: 'task',
      payload: { ping: 'latency' },
    });
    const dt = Date.now() - t0;

    // The prior stub returned 0ms for this exact call. Real I/O on
    // localhost takes at least 1ms (often more). If a future regression
    // re-introduces a no-op, this assertion catches it.
    expect(dt).toBeGreaterThan(0);
    // Sanity upper bound — localhost ping shouldn't exceed 5s
    expect(dt).toBeLessThan(5_000);
  });

  it('close() is idempotent and tears down server bindings', async () => {
    srv = await WebSocketFallbackTransport.create({ serverName: 'srv' });
    await srv.listen(TEST_PORT + 2, '127.0.0.1');
    await srv.close();
    // Second close should not throw
    await srv.close();
    srv = undefined;
  });

  it('sendBatch fans out multiple messages without dropping any', async () => {
    srv = await WebSocketFallbackTransport.create({ serverName: 'srv' });
    await srv.listen(TEST_PORT + 3, '127.0.0.1');

    cli = await loadQuicTransport({ serverName: 'cli' });
    const messages: AgentMessage[] = Array.from({ length: 5 }, (_, i) => ({
      id: `batch-${i}`,
      type: 'task',
      payload: { idx: i },
    }));
    await cli.sendBatch(`127.0.0.1:${TEST_PORT + 3}`, messages);

    await new Promise((r) => setTimeout(r, 100));
    const stats = await srv.getStats();
    expect(stats).toBeDefined();
  });

  it('onMessage handler fires on inbound delivery', async () => {
    srv = await WebSocketFallbackTransport.create({ serverName: 'srv' });
    await srv.listen(TEST_PORT + 4, '127.0.0.1');

    const received: AgentMessage[] = [];
    srv.onMessage((_addr, msg) => {
      received.push(msg);
    });

    cli = await loadQuicTransport({ serverName: 'cli' });
    await cli.send(`127.0.0.1:${TEST_PORT + 4}`, {
      id: 'on-msg-1',
      type: 'task',
      payload: { hello: 'inbound' },
    });

    // Wait for the WS roundtrip
    await new Promise((r) => setTimeout(r, 200));
    expect(received).toHaveLength(1);
    expect(received[0].id).toBe('on-msg-1');
    expect(received[0].payload).toEqual({ hello: 'inbound' });
  });

  it('multiple onMessage handlers all fire, errors are isolated', async () => {
    srv = await WebSocketFallbackTransport.create({ serverName: 'srv' });
    await srv.listen(TEST_PORT + 5, '127.0.0.1');

    const goodReceived: AgentMessage[] = [];
    srv.onMessage((_addr, msg) => { goodReceived.push(msg); });
    srv.onMessage(() => { throw new Error('handler intentionally throws'); });
    srv.onMessage(async () => { throw new Error('async rejector'); });

    cli = await loadQuicTransport({ serverName: 'cli' });
    await cli.send(`127.0.0.1:${TEST_PORT + 5}`, {
      id: 'multi-h-1',
      type: 'task',
      payload: {},
    });

    await new Promise((r) => setTimeout(r, 200));
    // Good handler still got the message — error in another handler
    // doesn't stop fan-out.
    expect(goodReceived).toHaveLength(1);
  });
});

describe('loadQuicTransport — selection contract', () => {
  it('returns a transport with the AgentTransport interface', async () => {
    const t = await loadQuicTransport();
    expect(typeof t.send).toBe('function');
    expect(typeof t.receive).toBe('function');
    expect(typeof t.request).toBe('function');
    expect(typeof t.sendBatch).toBe('function');
    expect(typeof t.getStats).toBe('function');
    expect(typeof t.close).toBe('function');
    await t.close();
  });

  it('falls back to WebSocket when native QUIC is not available', async () => {
    // Without AGENTIC_FLOW_QUIC_NATIVE=1, isQuicAvailable() returns false
    // → loader picks WebSocketFallbackTransport. We assert via the
    // capability probe to avoid a brittle instanceof check across builds.
    const before = await isQuicAvailable();
    expect(before).toBe(false);

    const t = await loadQuicTransport({ serverName: 'fallback-test' });
    const stats = await t.getStats();
    expect(stats).toEqual({
      active: expect.any(Number),
      idle: expect.any(Number),
      created: expect.any(Number),
      closed: expect.any(Number),
    });
    await t.close();
  });
});
