// The shared tools, called in-process: on the level check's tiny generated game and on a copy of
// a CD game (Nebula), reading, writing (with dry runs and read-only refusals), checking and drawing.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GameFiles } from '../../project/files';
import { testGame } from '../../editor/check/testGame';
import { parseMap } from '../../formats/map';
import { GAME_TOOL_DEFS } from './index';
import { MemoryContext } from './memoryContext';
import { argsProblem, runTool } from './run';
import type { ToolResult } from './types';

const tiny = () => {
  const t = testGame(['########', '#......#', '#......#', '#S..cE.#', '########']);
  return new MemoryContext(new GameFiles(t.files), 'test.gam');
};

const nebula = () => {
  const dir = join(__dirname, '../../../../cd/gameware/nebula');
  return new MemoryContext(new GameFiles(readdirSync(dir).map((n) => [n, new Uint8Array(readFileSync(join(dir, n)))])), 'nebula.gam');
};

const call = (ctx: MemoryContext, name: string, args: Record<string, unknown> = {}) =>
  runTool(
    GAME_TOOL_DEFS.find((d) => d.name === name)!,
    args,
    ctx,
  );
const body = (r: ToolResult) => JSON.parse((r.content[0] as { text: string }).text);
const words = (r: ToolResult) => r.content.map((c) => (c.type === 'text' ? c.text : '')).join(' ');

describe('assistant tools', () => {
  it('set_scene only puts files the game has, of the slot’s kind, in its slots', async () => {
    const ctx = tiny();
    const before = ctx.files.get('test.gam');
    const missing = await call(ctx, 'set_scene', { scene: 2, files: [{ slot: 1, file: 'mygame.map' }] });
    expect(missing.isError).toBe(true);
    expect(words(missing)).toMatch(/There is no file mygame\.map/);
    expect(ctx.files.get('test.gam')).toBe(before);
    // a file named for the wrong slot goes to its own
    const moved = await call(ctx, 'set_scene', { scene: 2, files: [{ slot: 1, file: 'test.bbl' }] });
    expect(words(moved)).toMatch(/test\.bbl went in slot 2 \(Background block set\), not 1/);
    expect((await call(ctx, 'set_scene', { scene: 2, files: [{ slot: 1, file: 'test.map' }] })).isError).toBeFalsy();
  });

  it('set_scene turns a level’s scrolling off and on, and only a level’s', async () => {
    const ctx = tiny();
    expect((await call(ctx, 'set_scene', { scene: 2, scroll: false })).isError).toBeFalsy();
    expect(body(await call(ctx, 'get_scene', { scene: 2 })).scroll).toMatchObject({ up: 0, down: 0, left: 0, right: 0 });
    await call(ctx, 'set_scene', { scene: 2, scroll: true });
    expect(body(await call(ctx, 'get_scene', { scene: 2 })).scroll).toMatchObject({ up: 255, down: 255, left: 255, right: 255 });
    expect(words(await call(ctx, 'set_scene', { scene: 0, scroll: false }))).toMatch(/not a level/);
  });

  it('have unique names, short descriptions and flat object schemas with dry_run on every write', () => {
    const names = GAME_TOOL_DEFS.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
    for (const d of GAME_TOOL_DEFS) {
      expect(d.name).toMatch(/^[a-z][a-z_]{2,40}$/);
      expect(d.description.length).toBeLessThan(260);
      expect(d.inputSchema.type).toBe('object');
      expect(JSON.stringify(d.inputSchema)).not.toMatch(/\$ref|oneOf|anyOf|allOf/);
      if (d.writes) expect(d.inputSchema.properties?.dry_run).toBeDefined();
    }
  });

  it('check their arguments', () => {
    const map = GAME_TOOL_DEFS.find((d) => d.name === 'get_map')!;
    expect(argsProblem(map.inputSchema, {})).toMatch(/file is required/);
    expect(argsProblem(map.inputSchema, { file: 'a.map', x: 200 })).toMatch(/x must be at most 99/);
    expect(argsProblem(map.inputSchema, { file: 'a.map', z: 1 })).toMatch(/unknown argument z/);
    expect(argsProblem(map.inputSchema, { file: 'a.map', x: 3 })).toBeUndefined();
  });

  it('read and write a tiny generated game', async () => {
    const ctx = tiny();
    const sum = body(await call(ctx, 'game_summary'));
    expect(sum.title).toBe('Test');
    expect(sum.scenes.map((s: { kind: string }) => s.kind)).toEqual(['title', 'game over', 'level']);
    const region = body(await call(ctx, 'get_map', { file: 'test.map', x: 0, y: 0, width: 8, height: 5 }));
    expect(region.rows[3]).toEqual([1, 0, 0, 0, 2, 0, 0, 1]);

    // a dry run changes nothing
    const before = ctx.files.get('test.map');
    const dry = await call(ctx, 'set_map', { file: 'test.map', x: 2, y: 1, rows: [[3, 3]], dry_run: true });
    expect(words(dry)).toMatch(/Dry run/);
    expect(ctx.files.get('test.map')).toBe(before);

    await call(ctx, 'set_map', { file: 'test.map', x: 2, y: 1, rows: [[3, 3]], monsters: [{ monster: 0, x: 4, y: 1 }] });
    const map = parseMap(ctx.files.get('test.map')!);
    expect([map.blocks[102], map.blocks[103]]).toEqual([3, 3]);
    expect(map.monsters[map.mons[104]].monnum).toBe(0);
    expect(ctx.dirty.has('test.map')).toBe(true);

    await call(ctx, 'set_links', { scene: 2, links: [{ index: 1, to_scene: 1, from_x: 6, from_y: 3 }] });
    expect(body(await call(ctx, 'get_links', { scene: 2 }))).toHaveLength(2);
    expect(words(await call(ctx, 'set_links', { scene: 2, links: [{ index: 1, to_scene: 9 }] }))).toMatch(/no scene 9/);

    await call(ctx, 'set_block', { file: 'test.bbl', index: 4, solid: 15, fill_color: 9 });
    expect(body(await call(ctx, 'get_block', { file: 'test.bbl', index: 4 })).solid).toBe(15);
    await call(ctx, 'set_sequence', { file: 'test.chr', sequence: 7, key_scan: 57, frames: [{ y: -4, top: 0, bottom: 1 }] });
    expect(body(await call(ctx, 'get_character', { file: 'test.chr', sequence: 7 })).frames).toHaveLength(1);
    await call(ctx, 'set_text', { file: 'help.txt', text: 'Walk right.\nGrab the coin.' });
    expect(body(await call(ctx, 'get_text', { file: 'help.txt' })).lines).toEqual(['Walk right.', 'Grab the coin.']);
    await call(ctx, 'set_player_patches', { patches: [{ id: 'str.menu.play', text: 'Go' }] });
    expect(ctx.playerPatches()['str.menu.play']).toBe('Go');
    expect(words(await call(ctx, 'set_player_patches', { patches: [{ id: 'str.menu.play', text: 'Much too long' }] }))).toMatch(/longer than 4/);
  });

  it('refuse writes while read-only', async () => {
    const ctx = tiny();
    ctx.readOnly = true;
    const r = await call(ctx, 'set_map', { file: 'test.map', rows: [[1]] });
    expect(r.isError).toBe(true);
    expect(ctx.dirty.size).toBe(0);
  });

  it('check, play and draw the tiny game', async () => {
    const ctx = tiny();
    expect(words(await call(ctx, 'validate'))).toBeTruthy();
    const check = body(await call(ctx, 'level_check', { play: true, budget_ms: 1500 }));
    expect(check.won).toBe(true);
    const bot = body(await call(ctx, 'bot_playtest', { budget_ms: 2000 }));
    expect(bot.won).toBe(true);
    expect(bot.engine_check.won).toBe(true);
    const png = await call(ctx, 'render_png', { what: 'map', scene: 2, width: 8, height: 3 });
    expect(png.content[0]).toMatchObject({ type: 'image', mimeType: 'image/png' });
    const bytes = Uint8Array.from(atob((png.content[0] as { data: string }).data), (c) => c.charCodeAt(0));
    expect([...bytes.subarray(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
    expect(new DataView(bytes.buffer).getUint32(16)).toBe(160);
  }, 60_000);

  it('read, check and draw a copy of a CD game', async () => {
    const ctx = nebula();
    const sum = body(await call(ctx, 'game_summary'));
    expect(sum.scenes.length).toBeGreaterThan(2);
    const level = sum.scenes.find((s: { kind: string }) => s.kind === 'level');
    expect(body(await call(ctx, 'list_blocks', { file: 'nebula.bbl' })).blocks.length).toBeGreaterThan(5);
    expect(body(await call(ctx, 'get_monsters', { file: 'monshade.mon' })).length).toBeGreaterThan(0);
    const check = body(await call(ctx, 'level_check', {}));
    expect(check).toHaveProperty('findings');
    for (const what of ['title', 'menu']) expect((await call(ctx, 'render_png', { what })).content[0].type).toBe('image');
    expect((await call(ctx, 'render_png', { what: 'blocks', file: 'nebula.bbl' })).content[0].type).toBe('image');
    expect((await call(ctx, 'render_png', { what: 'map', scene: level.scene })).content[0].type).toBe('image');
    expect(ctx.dirty.size).toBe(0);
  }, 60_000);
});
