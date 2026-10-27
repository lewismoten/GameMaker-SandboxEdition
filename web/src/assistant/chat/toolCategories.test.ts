// Tool groups: the few tools a model starts with, a group loaded on request (or by calling one of
// its tools) and put away after a few unused requests, the terse definitions, and what the core
// set saves in tokens against the full list.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { testGame } from '../../editor/check/testGame';
import { MemoryContext } from '../tools/memoryContext';
import { toOpenAITools } from '../openai';
import { GAME_TOOL_DEFS } from '../tools/index';
import { EDITOR_TOOL_SPECS } from '../bridge/editorTools';
import { Agent } from './agent';
import { chatTools } from './chatTools';
import { CATEGORIES, CORE, ToolSet, terse } from './toolCategories';
import { toolsTokens } from './tokens';
import type { ChatReply, ChatRequest } from './providers';

const ctx = () => new MemoryContext(new GameFiles(testGame(['#####', '#S.E#', '#####']).files), 'test.gam');
const tab = { specs: EDITOR_TOOL_SPECS, run: async () => ({ content: [] }) };

describe('tool groups', () => {
  it('cover every tool, once', () => {
    const all = chatTools(ctx(), tab).map((t) => t.def.name);
    const grouped = CATEGORIES.flatMap((c) => c.tools);
    expect(new Set(grouped).size).toBe(grouped.length);
    for (const n of all) expect(grouped.includes(n) || CORE.includes(n)).toBe(true);
  });

  it('start with the core, load a group, and put it away after unused requests', () => {
    const set = new ToolSet(chatTools(ctx(), tab));
    const names = () => set.active().map((t) => t.def.name);
    expect(names()).toEqual(['game_summary', 'bot_playtest', 'recipe']);
    set.nextRequest();
    expect(set.load('maps')).toEqual(['map_sketch', 'get_map', 'set_map']);
    expect(names()).toContain('set_map');
    expect(set.load('nonsense')).toBeUndefined();
    // a tool called from a group not out brings the group out
    expect(set.touch('set_block')).toBe(true);
    expect(set.touch('set_block')).toBe(false);
    for (let i = 0; i < 4; i++) set.nextRequest();
    expect(set.loadedIds.sort()).toEqual(['blocks', 'maps']);
    set.touch('get_map');
    set.nextRequest();
    expect(set.loadedIds).toEqual(['maps']);
    set.reset();
    expect(set.loadedIds).toEqual([]);
  });

  it('are terse: first sentences, short argument notes, no dry_run', () => {
    const t = terse(GAME_TOOL_DEFS.find((d) => d.name === 'set_map')!);
    expect(t.description).not.toMatch(/Makes the map/);
    expect(t.inputSchema.properties?.dry_run).toBeUndefined();
    expect(JSON.stringify(t.inputSchema)).not.toMatch(/dry_run/);
    for (const d of GAME_TOOL_DEFS) expect(terse(d).description.length).toBeLessThanOrEqual(140);
  });

  it('save most of the tools’ tokens at the start (the numbers are reported)', async () => {
    const all = chatTools(ctx(), tab);
    const fullOriginal = toolsTokens(toOpenAITools(all.map((t) => t.def)));
    const fullTerse = toolsTokens(toOpenAITools(all.map((t) => terse(t.def))));
    // what the agent offers at the start: core plus load_tools and recall
    let offered = 0;
    const agent = new Agent({
      chat: async (req: ChatRequest): Promise<ChatReply> => ((offered = toolsTokens(req.tools)), { content: 'ok', toolCalls: [] }),
      tools: all,
      system: () => 's',
      images: () => true,
      limit: () => 32000,
    });
    await agent.send('hi');
    const byGroup = Object.fromEntries(
      CATEGORIES.map((c) => [c.id, toolsTokens(toOpenAITools(all.filter((t) => c.tools.includes(t.def.name)).map((t) => terse(t.def))))]),
    );
    // as measured in October 2026: the full list about 6,370 tokens (5,160 terse), the start 282
    // (344 once recipe joined the core); a group 100 (editor) to 830 (scenes)
    expect(offered).toBeLessThan(fullOriginal / 10);
    expect(fullTerse).toBeLessThan(fullOriginal);
    expect(Math.max(...Object.values(byGroup))).toBeLessThan(1000);
  });
});
