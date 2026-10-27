// The MCP server's side of the bridge to the editor open in a browser tab (the protocol is
// src/assistant/bridge/protocol.ts): a WebSocket server on 127.0.0.1 only, on a random port,
// that one tab at a time may join by typing the pairing code the server shows. Nothing is sent
// to a tab before it pairs; a page from an origin not allowed is turned away; after 10 wrong
// codes the bridge stops taking any until a new code is made. Calls wait for the tab's answer.
import { WebSocketServer, type WebSocket } from 'ws';
import type { AddressInfo } from 'node:net';
import {
  BRIDGE_VERSION,
  MAX_MESSAGE,
  newPairingCode,
  originAllowed,
  readToServer,
  sameCode,
  type EditorState,
  type ToEditor,
} from '../../src/assistant/bridge/protocol';
import { fail, type ToolResult } from '../../src/assistant/tools/types';

const MAX_FAILURES = 10;
const HELLO_MS = 15_000;

export class EditorBridge {
  private wss?: WebSocketServer;
  private tab?: WebSocket;
  private failures = 0;
  private nextId = 1;
  private waiting = new Map<number, (r: ToolResult) => void>();
  code = newPairingCode();
  port = 0;
  state?: EditorState;
  /** Told when a tab pairs or leaves. */
  onChange?: (paired: boolean) => void;

  constructor(private readonly origins: readonly string[] = []) {}

  get paired(): boolean {
    return !!this.tab;
  }

  get locked(): boolean {
    return this.failures >= MAX_FAILURES;
  }

  /** Starts listening (once); resolves with the port. */
  async start(): Promise<number> {
    if (this.wss) return this.port;
    const wss = new WebSocketServer({
      host: '127.0.0.1',
      port: 0,
      maxPayload: MAX_MESSAGE,
      verifyClient: (info: { origin: string }) => originAllowed(info.origin, this.origins),
    });
    this.wss = wss;
    await new Promise<void>((resolve, reject) => (wss.once('listening', resolve), wss.once('error', reject)));
    this.port = (wss.address() as AddressInfo).port;
    wss.on('connection', (ws) => this.greet(ws));
    return this.port;
  }

  private greet(ws: WebSocket): void {
    const send = (m: ToEditor) => ws.send(JSON.stringify(m));
    const timer = setTimeout(() => ws.close(4000, 'No pairing code'), HELLO_MS);
    let paired = false;
    ws.on('message', (data) => {
      const m = readToServer(Buffer.isBuffer(data) ? data.toString('utf8') : Buffer.from(data as ArrayBuffer).toString('utf8'));
      if (!paired) {
        clearTimeout(timer);
        if (m?.type !== 'hello') return ws.close(4001, 'Pair first');
        if (m.version !== BRIDGE_VERSION) return (send({ type: 'denied', reason: `This server speaks bridge version ${BRIDGE_VERSION}.` }), ws.close(4002));
        if (this.locked) return (send({ type: 'denied', reason: 'Too many wrong codes: ask for a new code (editor_bridge new_code).' }), ws.close(4003));
        if (!sameCode(m.code, this.code)) {
          this.failures++;
          return (send({ type: 'denied', reason: 'That is not the pairing code.' }), ws.close(4004));
        }
        if (this.tab) return (send({ type: 'denied', reason: 'Another tab is paired; disconnect it first.' }), ws.close(4005));
        paired = true;
        this.failures = 0;
        this.tab = ws;
        send({ type: 'welcome', server: 'gamemaker-sandbox MCP server' });
        this.onChange?.(true);
        return;
      }
      if (m?.type === 'result') this.waiting.get(m.id)?.(m.result);
      else if (m?.type === 'state') this.state = m.state;
    });
    ws.on('close', () => {
      clearTimeout(timer);
      if (this.tab !== ws) return;
      this.tab = undefined;
      this.state = undefined;
      for (const done of this.waiting.values()) done(fail('The editor tab disconnected before answering.'));
      this.waiting.clear();
      this.onChange?.(false);
    });
  }

  /** Runs a tool in the paired tab. */
  call(tool: string, args: Record<string, unknown>, timeoutMs = 120_000): Promise<ToolResult> {
    const tab = this.tab;
    if (!tab)
      return Promise.resolve(
        fail('No editor tab is paired. Start the bridge (editor_bridge), then in the editor press Assistant and enter the port and code.'),
      );
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(
        () => (this.waiting.delete(id), resolve(fail(`The editor didn’t answer ${tool} within ${Math.round(timeoutMs / 1000)} s.`))),
        timeoutMs,
      );
      this.waiting.set(id, (r) => (clearTimeout(timer), this.waiting.delete(id), resolve(r)));
      tab.send(JSON.stringify({ type: 'call', id, tool, args } satisfies ToEditor));
    });
  }

  /** A new code: the old one stops working, a lock-out ends, and a paired tab is let go. */
  renew(): void {
    this.code = newPairingCode();
    this.failures = 0;
    this.tab?.close(4006, 'New pairing code');
  }

  async stop(): Promise<void> {
    this.tab?.close(1001, 'Server stopping');
    const wss = this.wss;
    this.wss = undefined;
    this.port = 0;
    if (wss) await new Promise<void>((resolve) => wss.close(() => resolve()));
  }
}
