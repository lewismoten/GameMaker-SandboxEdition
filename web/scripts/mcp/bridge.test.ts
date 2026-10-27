// The MCP server's bridge to an editor tab: pairing (the code, the origin, the lock-out after
// wrong codes), and tool calls going to the paired tab and back, through the MCP tools.
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import { EditorBridge } from './bridge';
import { callTool } from './server';
import { Roots } from './roots';
import { readToEditor } from '../../src/assistant/bridge/protocol';

const ORIGIN = 'http://localhost:5173';
let bridge: EditorBridge;
afterEach(() => bridge?.stop());

/** A tab: connects, says hello with `code`, and answers calls with `answer`. */
function tab(port: number, code: string, answer?: (tool: string, args: Record<string, unknown>) => unknown, origin = ORIGIN) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`, { origin });
  const got: string[] = [];
  const closed = new Promise<number>((resolve) => ws.on('close', (c) => resolve(c)));
  const opened = new Promise<void>((resolve, reject) => (ws.on('open', () => resolve()), ws.on('error', reject)));
  ws.on('open', () => ws.send(JSON.stringify({ type: 'hello', version: 1, code, page: origin })));
  ws.on('message', (data) => {
    const m = readToEditor((data as Buffer).toString());
    if (!m) return;
    got.push(m.type);
    if (m.type === 'call' && answer) ws.send(JSON.stringify({ type: 'result', id: m.id, result: answer(m.tool, m.args) }));
  });
  const welcomed = () => new Promise<void>((resolve) => ws.on('message', (d) => readToEditor((d as Buffer).toString())?.type === 'welcome' && resolve()));
  return { ws, got, closed, opened, welcomed };
}

describe('the editor bridge', () => {
  it('pairs a tab with the right code only', async () => {
    bridge = new EditorBridge();
    const port = await bridge.start();
    const wrong = tab(port, '000-000' === bridge.code ? '111-111' : '000-000');
    expect(await wrong.closed).toBe(4004);
    expect(wrong.got).toEqual(['denied']);
    expect(bridge.paired).toBe(false);
    const right = tab(port, bridge.code);
    await right.welcomed();
    expect(bridge.paired).toBe(true);
    // a second tab is turned away while one is paired
    const second = tab(port, bridge.code);
    expect(await second.closed).toBe(4005);
    right.ws.close();
    await right.closed;
  });

  it('turns away pages from other origins before they can say anything', async () => {
    bridge = new EditorBridge();
    const port = await bridge.start();
    const t = tab(port, bridge.code, undefined, 'https://example.com');
    await expect(t.opened).rejects.toThrow(/401|Unexpected server response/);
  });

  it('stops taking codes after ten wrong ones, until a new code is made', async () => {
    bridge = new EditorBridge();
    const port = await bridge.start();
    const bad = bridge.code === '999-999' ? '999-998' : '999-999';
    for (let i = 0; i < 10; i++) await tab(port, bad).closed;
    expect(bridge.locked).toBe(true);
    expect(await tab(port, bridge.code).closed).toBe(4003);
    bridge.renew();
    const t = tab(port, bridge.code);
    await t.welcomed();
    expect(bridge.paired).toBe(true);
    t.ws.close();
  });

  it('sends the game tools to the paired tab once open_game targets the editor', async () => {
    bridge = new EditorBridge();
    const state = { roots: new Roots([mkdtempSync(join(tmpdir(), 'gm-bridge-'))]), bridge };
    const t = (r: Awaited<ReturnType<typeof callTool>>) => r.content.map((c) => (c.type === 'text' ? c.text : c.type)).join(' ');
    expect(t(await callTool(state, 'open_game', { source: 'editor' }))).toMatch(/No editor tab is paired/);
    const started = JSON.parse(t(await callTool(state, 'editor_bridge', { action: 'start' })));
    expect(started.pairing_code).toBe(bridge.code);
    const calls: string[] = [];
    const editor = tab(started.port, started.pairing_code, (tool, args) => {
      calls.push(`${tool} ${JSON.stringify(args)}`);
      return { content: [{ type: 'text', text: tool === 'editor_state' ? '{"readOnly":false}' : `ran ${tool}` }] };
    });
    await editor.welcomed();
    expect(t(await callTool(state, 'open_game', { source: 'editor' }))).toMatch(/editor tab/);
    expect(t(await callTool(state, 'set_map', { file: 'a.map', rows: [[1]] }))).toBe('ran set_map');
    expect(t(await callTool(state, 'editor_screenshot', {}))).toBe('ran editor_screenshot');
    expect(calls).toEqual(['editor_state {}', 'set_map {"file":"a.map","rows":[[1]]}', 'editor_screenshot {}']);
    expect(t(await callTool(state, 'save', {}))).toMatch(/saves its project by itself/);
    editor.ws.close();
    await editor.closed;
    await new Promise((r) => setTimeout(r, 20));
    expect(t(await callTool(state, 'get_map', { file: 'a.map' }))).toMatch(/No editor tab is paired/);
  });
});
