// The MCP server end to end: an MCP client talking to it in-process (a copy of a CD game, and a
// tiny game made from nothing through the tools alone), the folder rules, and the real stdio
// server started as `npm run mcp` would start it.
import { afterAll, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from './server';
import { GAMES_DIR, Roots } from './roots';
import type { ServerState } from './serverTools';

const work = mkdtempSync(join(tmpdir(), 'gm-mcp-test-'));
afterAll(() => rmSync(work, { recursive: true, force: true }));

async function connect(state: ServerState): Promise<Client> {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(state).connect(a);
  const client = new Client({ name: 'test', version: '1' });
  await client.connect(b);
  return client;
}

type Result = Awaited<ReturnType<Client['callTool']>>;
const textOf = (r: Result) => (r.content as { type: string; text?: string }[]).map((c) => c.text ?? '').join(' ');
const jsonOf = (r: Result) => {
  if (r.isError) throw new Error(textOf(r));
  const t = textOf(r);
  // a write answers in words ("Applied: …"), a read in JSON
  return t.startsWith('{') || t.startsWith('[') ? JSON.parse(t) : t;
};

describe('the MCP server', () => {
  it('lists its tools with schemas and read-only hints', async () => {
    const client = await connect({ roots: new Roots([work]) });
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const n of ['list_games', 'open_game', 'save', 'export_game', 'get_map', 'set_map', 'level_check', 'bot_playtest', 'render_png'])
      expect(names).toContain(n);
    expect(tools.find((t) => t.name === 'get_map')!.annotations?.readOnlyHint).toBe(true);
    expect(tools.find((t) => t.name === 'set_map')!.annotations?.readOnlyHint).toBe(false);
  });

  it('lists the CD’s and this project’s games, never a secret one', async () => {
    const client = await connect({ roots: new Roots([work]) });
    const { games } = jsonOf(await client.callTool({ name: 'list_games', arguments: {} }));
    const sources = games.map((g: { source: string }) => g.source);
    expect(sources).toContain('cd:nebula');
    expect(sources.some((s: string) => s.startsWith('sandbox:'))).toBe(true);
    const secret = readdirSync(GAMES_DIR).filter((id) => {
      try {
        return JSON.parse(readFileSync(join(GAMES_DIR, id, 'about.json'), 'utf8')).secret === true;
      } catch {
        return false;
      }
    });
    for (const id of secret) expect(sources).not.toContain(`sandbox:${id}`);
  });

  it('edits a copy of a CD game and saves only to its working folder', async () => {
    const client = await connect({ roots: new Roots([work]) });
    const workdir = join(work, 'nebula');
    const call = (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });
    expect((await call('get_map', { file: 'stars.map' })).isError).toBe(true); // nothing open yet
    jsonOf(await call('open_game', { source: 'cd:nebula', workdir }));
    jsonOf(await call('set_map', { file: 'stars.map', x: 0, y: 0, rows: [[1, 2, 3]] }));
    expect(existsSync(workdir)).toBe(false); // nothing written before save
    const dry = jsonOf(await call('save', { dry_run: true }));
    expect(dry.written.length).toBeGreaterThan(10);
    expect(existsSync(workdir)).toBe(false);
    jsonOf(await call('save'));
    expect(readdirSync(workdir)).toContain('STARS.MAP');
    expect([...readFileSync(join(workdir, 'STARS.MAP')).subarray(0, 6)]).toEqual([1, expect.any(Number), 2, expect.any(Number), 3, expect.any(Number)]);
    // the CD's own files are untouched
    expect(readFileSync(join(GAMES_DIR, '..', 'cd', 'gameware', 'nebula', 'stars.map'))[0]).not.toBe(99);
    const img = await call('render_png', { what: 'map', file: 'stars.map', width: 8, height: 6 });
    expect((img.content as { type: string }[])[0].type).toBe('image');
  });

  it('refuses folders outside its roots and this repository’s games', async () => {
    const client = await connect({ roots: new Roots([work]) });
    const call = (name: string, args: Record<string, unknown>) => client.callTool({ name, arguments: args });
    expect(textOf(await call('open_game', { source: '/etc' }))).toMatch(/outside the folders/);
    expect(textOf(await call('open_game', { source: 'cd:nebula', workdir: join(GAMES_DIR, 'x') }))).toMatch(/outside the writable folders|never written/);
    expect(() => new Roots([join(GAMES_DIR, 'teddy')])).toThrow(/never written/);
  });

  it('makes a tiny game from nothing, plays it with the bot and opens it again', async () => {
    const client = await connect({ roots: new Roots([work]) });
    const call = (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });
    const workdir = join(work, 'tiny');
    jsonOf(await call('new_game', { title: 'Tiny', workdir }));
    jsonOf(await call('set_block', { file: 'tiny.bbl', index: 0, gravity: 4 }));
    jsonOf(await call('set_block', { file: 'tiny.bbl', index: 1, solid: 15, fill_color: 7 }));
    const rows = ['##########', '#........#', '#........#', '#........#', '##########'].map((r) => [...r].map((c) => (c === '#' ? 1 : 0)));
    jsonOf(await call('set_map', { file: 'tiny.map', fill: 1, rows }));
    jsonOf(await call('set_block', { file: 'tiny.cbl', index: 0, fill_color: 3 }));
    jsonOf(await call('set_block', { file: 'tiny.cbl', index: 1, fill_color: 3 }));
    const step = (dx: number) => Array.from({ length: 4 }, () => ({ x: dx, top: 0, bottom: 1, pause: 1 }));
    jsonOf(await call('set_sequence', { file: 'tiny.chr', sequence: 5, key_scan: 77, frames: step(4) }));
    jsonOf(await call('set_sequence', { file: 'tiny.chr', sequence: 6, key_scan: 75, frames: step(-4) }));
    jsonOf(await call('set_palette', { file: 'tiny.pal', colors: [[0, 0, 0]] }));
    const added = await call('add_scene', {
      name: 'Level 1',
      files: [0, 1, 2, 5, 6].map((slot) => ({ slot, file: ['tiny.pal', 'tiny.map', 'tiny.bbl', '', '', 'tiny.chr', 'tiny.cbl'][slot] })),
    });
    expect(textOf(added)).toMatch(/scene 2/);
    jsonOf(await call('set_links', { scene: 0, links: [{ index: 0, to_scene: 2, to_x: 1, to_y: 3 }] }));
    jsonOf(await call('set_links', { scene: 2, links: [{ index: 0, to_scene: 1, from_x: 7, from_y: 3 }] }));
    const bot = jsonOf(await call('bot_playtest', { budget_ms: 3000 }));
    expect(bot.won).toBe(true);
    jsonOf(await call('record_walkthrough', { budget_ms: 3000 }));
    jsonOf(await call('save'));
    expect(readdirSync(workdir).sort()).toEqual(
      ['ASSISTANT', 'TINY.BBL', 'TINY.CBL', 'TINY.CHR', 'TINY.GAM', 'TINY.MAP', 'TINY.PAL'].map((n) => (n === 'ASSISTANT' ? 'assistant' : n)).sort(),
    );
    jsonOf(await call('close_game'));
    const again = jsonOf(await call('open_game', { source: workdir }));
    expect(again.opened.workdir).toBe(workdir.replace(/^\/var\//, '/private/var/'));
    expect(jsonOf(await call('game_summary')).scenes).toHaveLength(3);
  }, 60_000);

  // the DOS player comes from a built site (web/dist), which a fresh clone doesn't have
  it.skipIf(!existsSync(join(__dirname, '../../dist/dos/xferplay.exe')))('builds the DOS download into a writable folder', async () => {
    const client = await connect({ roots: new Roots([work]) });
    const call = (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });
    jsonOf(await call('open_game', { source: 'cd:nebula' }));
    const r = jsonOf(await call('export_game', { format: 'dos', out_dir: join(work, 'exports') }));
    expect(r.written).toMatch(/nebula-dos\.zip$/);
    expect(textOf(await call('export_game', { format: 'dos', out_dir: tmpdir() }))).toMatch(/outside the writable folders/);
  });

  it('runs over stdio as npm run mcp starts it', async () => {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['vite-node', '-c', 'scripts/mcp/vite.config.ts', 'scripts/mcp/main.ts', '--', '--root', work],
      cwd: join(__dirname, '../..'),
      stderr: 'ignore',
    });
    const client = new Client({ name: 'stdio-test', version: '1' });
    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools.length).toBeGreaterThan(30);
    const opened = jsonOf(await client.callTool({ name: 'open_game', arguments: { source: 'cd:nebula', read_only: true } }));
    expect(opened.opened.read_only).toBe(true);
    expect((await client.callTool({ name: 'set_text', arguments: { file: 'a.txt', text: 'x' } })).isError).toBe(true);
    await client.close();
  }, 60_000);
});
