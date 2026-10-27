// The recipes: the list and one recipe by id or by loose words, each short enough for a small
// model's context, and honest: every tool a recipe calls exists, and every argument it gives a
// tool (or names as `name:` anywhere) is in that tool's schema, so a recipe can't teach a model
// a field that isn't there.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { estimateTokens } from '../chat/tokens';
import { terse } from '../chat/toolCategories';
import { GAME_TOOL_DEFS } from './index';
import { MemoryContext } from './memoryContext';
import { RECIPES } from './recipeTools';
import { runTool } from './run';
import type { JsonSchema, ToolResult } from './types';

const ctx = new MemoryContext(new GameFiles(), 'none.gam');
const recipe = (topic?: string) =>
  runTool(
    GAME_TOOL_DEFS.find((d) => d.name === 'recipe')!,
    topic === undefined ? {} : { topic },
    ctx,
  );
const words = (r: ToolResult) => (r.content[0] as { text: string }).text;

/** Every property name anywhere in a schema. */
function props(s: JsonSchema, out = new Set<string>()): Set<string> {
  for (const [k, v] of Object.entries(s.properties ?? {})) (out.add(k), props(v, out));
  if (s.items) props(s.items, out);
  return out;
}

const tools = new Map(GAME_TOOL_DEFS.map((d) => [d.name, props(d.inputSchema)]));
const anyProp = new Set([...tools.values()].flatMap((p) => [...p]));

/** Each tool(...) call in a text: the tool and the argument names given (key: value, or a bare name). */
function calls(text: string): { tool: string; args: string[] }[] {
  const out: { tool: string; args: string[] }[] = [];
  for (const m of text.matchAll(/\b([a-z_]+)\(/g)) {
    let depth = 0;
    let end = m.index + m[0].length;
    for (; end < text.length; end++) {
      if ('([{'.includes(text[end])) depth++;
      else if (')]}'.includes(text[end])) if (depth-- === 0) break;
    }
    const inner = text.slice(m.index + m[0].length, end);
    const keyed = [...inner.matchAll(/([a-z_]+)\s*:/g)].map((k) => k[1]);
    const bare = [...`,${inner}`.matchAll(/[,({[]\s*([a-z_]+)\s*(?=[,)}\]]|$)/g)].map((k) => k[1]);
    out.push({ tool: m[1], args: [...keyed, ...bare] });
  }
  return out;
}

describe('recipe tool', () => {
  it('lists every topic, a short line each', async () => {
    const list = words(await recipe());
    for (const r of RECIPES) expect(list).toContain(`${r.id}: ${r.about}`);
    expect(estimateTokens(list)).toBeLessThan(300);
  });

  it('returns one by id or by loose words, and the list for nonsense', async () => {
    expect(words(await recipe('keys_locks'))).toMatch(/^keys_locks\n/);
    expect(words(await recipe('Keys and Locks'))).toMatch(/^keys_locks\n/);
    expect(words(await recipe('side scroller'))).toMatch(/^platformer\n/);
    expect(words(await recipe('3D driving'))).toMatch(/^road_3d\n/);
    expect(words(await recipe('NPC chat'))).toMatch(/^talk\n/);
    expect(words(await recipe('xyzzy'))).toMatch(/No recipe for "xyzzy"[\s\S]*platformer:/);
  });

  it('is one short sentence, whole in the chat’s terse copy', () => {
    const def = GAME_TOOL_DEFS.find((d) => d.name === 'recipe')!;
    expect(terse(def).description).toBe(def.description);
  });

  it('needs no game', async () => {
    expect((await recipe('timer')).isError).toBeFalsy();
  });

  it('keeps each recipe brief', () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    for (const r of RECIPES) {
      expect(r.id).toMatch(/^[a-z][a-z0-9_]+$/);
      expect(estimateTokens(r.text), r.id).toBeLessThanOrEqual(330);
      expect(estimateTokens(r.text), r.id).toBeGreaterThanOrEqual(100);
    }
  });

  it('calls only tools that exist, with arguments their schemas have', () => {
    const all = RECIPES.flatMap((r) => calls(r.text));
    expect(all.length).toBeGreaterThan(60);
    expect(all.flatMap((c) => c.args).length).toBeGreaterThan(150);
    expect(calls('set_links(scene: 0, links: [{index, to_scene: 2}])')).toEqual([{ tool: 'set_links', args: ['scene', 'links', 'to_scene', 'index'] }]);
    for (const r of RECIPES) {
      for (const c of calls(r.text)) {
        expect(tools.has(c.tool), `${r.id}: no tool ${c.tool}`).toBe(true);
        for (const a of c.args) expect(tools.get(c.tool)!.has(a), `${r.id}: ${c.tool} has no ${a}`).toBe(true);
      }
    }
  });

  it('names only real tools, arguments and recipes', () => {
    const ids = new Set(RECIPES.map((r) => r.id));
    for (const r of RECIPES) {
      // anything_with_an_underscore is a tool, an argument or a recipe
      for (const [w] of r.text.matchAll(/\b[a-z]+(?:_[a-z0-9]+)+\b/g)) expect(tools.has(w) || anyProp.has(w) || ids.has(w), `${r.id}: unknown ${w}`).toBe(true);
      // and so is any lower-case "name:" given a number or a list
      for (const m of r.text.matchAll(/(?<![\w.-])([a-z_]+): (?=[-\d[{])/g)) expect(anyProp.has(m[1]), `${r.id}: unknown argument ${m[1]}`).toBe(true);
      // "recipe x" points at a recipe there is
      for (const m of r.text.matchAll(/\brecipe ([a-z_0-9]+)/g)) expect(ids.has(m[1]), `${r.id}: no recipe ${m[1]}`).toBe(true);
    }
  });
});
