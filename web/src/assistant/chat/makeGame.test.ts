// Making a game from a description, end to end with a fake model: an "Empty" game gets the
// starter level (from the CD's SAMPLE, as the editor's starter uses), then the model's scripted
// tool calls name it, shape the level, place a monster and add an exit; the bot must win it. A
// model that forgets the exit is shown the bot's report and asked again.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GameFiles } from '../../project/files';
import { newGame, parseGame, serializeGame } from '../../formats/game';
import { MemoryContext } from '../tools/memoryContext';
import { Agent } from './agent';
import { chatTools } from './chatTools';
import { buildGame, hasNoLevel, starterChange } from './makeGame';
import type { ChatMessage, ChatReply, ChatRequest } from './providers';
import { systemPrompt } from './prompt';
import { messagesTokens, toolsTokens } from './tokens';
import { GAME_TOOL_DEFS } from '../tools/index';
import { runTool } from '../tools/run';
import { resultText } from './agent';

const sample = () => {
  const dir = join(__dirname, '../../../../cd/gameware/sample');
  return new GameFiles(readdirSync(dir).map((n) => [n, new Uint8Array(readFileSync(join(dir, n)))]));
};

const emptyGame = () => {
  const files = new GameFiles();
  files.set('picnic.gam', serializeGame(newGame('My Game')));
  return new MemoryContext(files, 'picnic.gam');
};

function scripted(replies: ChatReply[]) {
  const seen: ChatMessage[][] = [];
  let n = 0;
  return {
    seen,
    chat: async (req: ChatRequest): Promise<ChatReply> => {
      seen.push(req.messages.map((m) => ({ ...m })));
      const r = replies.shift() ?? { content: 'Done.', toolCalls: [] };
      return { ...r, toolCalls: r.toolCalls.map((c) => ({ ...c, id: `call${++n}` })) };
    },
  };
}
const step = (name: string, args: Record<string, unknown>): ChatReply => ({ content: '', toolCalls: [{ id: '', name, args }] });

// a row of the walled area: wall, 28 cells, wall
const row = (inside: number[]) => [31, ...inside, 31];

describe('making a game from a description', () => {
  it('builds a winnable game from scripted tool calls', async () => {
    const ctx = emptyGame();
    expect(hasNoLevel(ctx)).toBe(true);
    const change = starterChange(ctx, sample())!;
    await ctx.apply(change);
    expect(hasNoLevel(ctx)).toBe(false);

    const m = scripted([
      step('game_summary', {}),
      step('list_blocks', { file: 'picnic.bbl' }),
      step('set_scene', { scene: 0, name: 'Picnic Panic' }),
      step('set_scene', { scene: 2, name: 'The Park' }),
      // a wall across the middle with a gap, then the monsters
      step('set_map', { file: 'picnic.map', x: 35, y: 48, rows: [row([...Array<number>(20).fill(31), ...Array<number>(8).fill(0)])] }),
      step('set_map', { file: 'picnic.map', monsters: [{ monster: 1, x: 40, y: 55 }] }),
      // the exit: a link to scene 1 (game won) in the far corner
      step('set_links', { scene: 2, links: [{ index: 0, to_scene: 1, from_x: 62, from_y: 57 }] }),
      step('bot_playtest', { budget_ms: 5000 }),
      step('level_check', { severity: 'error' }),
      {
        content:
          'I made Picnic Panic: one park level with a wall to get round and an exit in the far corner. Next: add pickups, a second level, a title picture.',
        toolCalls: [],
      },
    ]);
    const agent = new Agent({ chat: m.chat, tools: chatTools(ctx), system: () => 'system', images: () => false, limit: () => 32_000 });
    const r = await buildGame(agent, ctx, 'A picnic in the park, where friendly ants carry the food home.');
    expect(r.won).toBe(true);
    expect(r.reply).toMatch(/Picnic Panic/);
    const game = parseGame(ctx.files.get('picnic.gam')!);
    expect(game.scenes[0].desc.trim()).toBe('Picnic Panic');
    expect(game.scenes[2].desc.trim()).toBe('The Park');
    // the model was given the description, and every tool call had an answer
    expect(m.seen[0][1].content).toMatch(/friendly ants/);
    const last = m.seen[m.seen.length - 1];
    expect(last.filter((x) => x.role === 'tool').every((x) => !x.content.startsWith('Error'))).toBe(true);
  }, 120_000);

  it('asks again when the bot can’t win, until it can', async () => {
    const ctx = emptyGame();
    await ctx.apply(starterChange(ctx, sample())!);
    const m = scripted([
      step('set_scene', { scene: 0, name: 'Lost Kite' }),
      { content: 'Done: Lost Kite.', toolCalls: [] },
      // asked again with the bot's report
      step('set_links', { scene: 2, links: [{ index: 0, to_scene: 1, from_x: 55, from_y: 50 }] }),
      { content: 'Added an exit; the bot wins now.', toolCalls: [] },
    ]);
    const agent = new Agent({ chat: m.chat, tools: chatTools(ctx), system: () => 'system', images: () => false, limit: () => 32_000 });
    const r = await buildGame(agent, ctx, 'A kite caught in a tree.');
    expect(r.won).toBe(true);
    const asked = m.seen.find((s) => s.some((x) => x.role === 'user' && /can’t win the game yet/.test(x.content)));
    expect(asked).toBeDefined();
  }, 120_000);

  it('fits a 4k context the whole way: the compact prompts, tool groups, cut results and compaction', async () => {
    const ctx = emptyGame();
    await ctx.apply(starterChange(ctx, sample())!);
    const LIMIT = 4096;
    const sizes: number[] = [];
    const texts: string[] = [];
    // a model that writes some calls as text, loads groups, and asks for far too much once
    const steps: ChatReply[] = [
      { content: '{"name": "load_tools", "arguments": {"group": "scenes"}}', toolCalls: [] },
      step('set_scene', { scene: 0, name: 'Penguin Cave' }),
      step('set_scene', { scene: 2, name: 'Ice Cave' }),
      step('list_blocks', { file: 'picnic.bbl' }),
      // the whole 100 x 100 map: far too much for 4k, cut to its budget
      step('get_map', { file: 'picnic.map' }),
      {
        content:
          'Walls first. {"name":"set_map","arguments":{"file":"picnic.map","x":35,"y":48,"rows":[' +
          JSON.stringify(row([...Array<number>(20).fill(31), ...Array<number>(8).fill(0)])) +
          ']}}',
        toolCalls: [],
      },
      step('set_map', { file: 'picnic.map', monsters: [{ monster: 1, x: 40, y: 55 }] }),
      step('set_links', { scene: 2, links: [{ index: 0, to_scene: 1, from_x: 62, from_y: 57 }] }),
      step('bot_playtest', { budget_ms: 5000 }),
      { content: 'Penguin Cave: an icy cave with a wall to slide round, a friendly seal and an exit. The bot won.', toolCalls: [] },
    ];
    const chat = async (req: ChatRequest): Promise<ChatReply> => {
      sizes.push(messagesTokens(req.messages) + toolsTokens(req.tools));
      texts.push(req.messages[0].content);
      const r = steps.shift() ?? { content: 'Done.', toolCalls: [] };
      if (r.content) req.onText?.(r.content);
      for (const c of r.toolCalls) req.onToolCall?.(c);
      return { ...r, toolCalls: r.toolCalls.map((c, i) => ({ ...c, id: `n${sizes.length}_${i}` })) };
    };
    const agent = new Agent({
      chat,
      tools: chatTools(ctx),
      system: async (compact) => systemPrompt({ summary: resultText(await runTool(GAME_TOOL_DEFS[0], {}, ctx)), readOnly: false, images: false, compact }),
      images: () => false,
      limit: () => LIMIT,
    });
    expect(agent.small).toBe(true);
    const r = await buildGame(agent, ctx, 'A friendly penguin slides around an icy cave collecting fish, then waddles to the exit.');
    expect(r.won).toBe(true);
    // every request fit, with room for the reply
    expect(Math.max(...sizes)).toBeLessThanOrEqual(LIMIT - 819);
    expect(texts[0]).toMatch(/^You help make a game in Game-Maker, a 1990s DOS game kit/);
    expect(parseGame(ctx.files.get('picnic.gam')!).scenes[0].desc.trim()).toBe('Penguin Cave');
  }, 120_000);
});
