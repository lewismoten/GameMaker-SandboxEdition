// A model that streams a long reply with tool calls written as text (set_map, render_png and
// more): each call runs as soon as its closing brace arrives, one at a time in order, while the
// reply streams on; the words around the calls come through without the calls; native calls
// from the stream run the same way; and Stop cancels the calls not yet run.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { testGame } from '../../editor/check/testGame';
import { parseMap } from '../../formats/map';
import { MemoryContext } from '../tools/memoryContext';
import { Agent, type AgentEvent } from './agent';
import { chatTools } from './chatTools';
import type { ChatReply, ChatRequest } from './providers';

const game = () => new MemoryContext(new GameFiles(testGame(['########', '#S....E#', '########']).files), 'test.gam');
const tick = () => new Promise((r) => setTimeout(r, 1));

const REPLY = [
  'I will wall it in first.\n',
  '{"name": "set_map", "arguments": {"file": "test.map", "x": 2, "y": 1, ',
  '"rows": [[1, 1]]}}\n',
  'Now let me look at it.\n```json\n{"name":"render_png","arguments":{"what":"map","file":"test.map","width":8,"height":3}}\n```\n',
  'And another wall: {"name":"set_map","arguments":{"file":"test.map","x":4,"y":1,"rows":[[1]]}} ',
  'then a sketch {"name":"map_sketch","arguments":{"file":"test.map","width":8,"height":3}}',
  '\nThat is the level.',
];

/** Streams REPLY a piece at a time (each after a tick), noting each piece in `log`. */
function streamingModel(log: string[], stopAfter?: { piece: number; stop: AbortController }) {
  let turn = 0;
  return async (req: ChatRequest): Promise<ChatReply> => {
    if (turn++ > 0) return { content: 'All done.', toolCalls: [] };
    let soFar = '';
    for (const [i, piece] of REPLY.entries()) {
      req.signal?.throwIfAborted();
      soFar += piece;
      log.push(`piece ${i}`);
      req.onText?.(soFar);
      if (stopAfter?.piece === i) stopAfter.stop.abort();
      await tick();
      await tick();
    }
    return { content: soFar, toolCalls: [] };
  };
}

describe('tool calls as they stream in', () => {
  it('run as each completes, in order, while the reply streams on; the words leave the calls out', async () => {
    const ctx = game();
    const log: string[] = [];
    const events: AgentEvent[] = [];
    const agent = new Agent({ chat: streamingModel(log), tools: chatTools(ctx), system: () => 'S', images: () => true, limit: () => 32000 });
    await agent.send('Build it and show me a picture', {
      onEvent: (e) => {
        events.push(e);
        if (e.type === 'result') log.push(`ran ${e.call.name}`);
      },
    });
    // the first set_map ran before the reply had finished streaming
    expect(log.indexOf('ran set_map')).toBeLessThan(log.indexOf('piece 4'));
    expect(log.indexOf('ran render_png')).toBeLessThan(log.indexOf('piece 6'));
    expect(log.filter((l) => l.startsWith('ran'))).toEqual(['ran set_map', 'ran render_png', 'ran set_map', 'ran map_sketch']);
    const map = parseMap(ctx.files.get('test.map')!);
    expect([map.blocks[102], map.blocks[103], map.blocks[104]]).toEqual([1, 1, 1]);
    // the picture came back as a picture (the request asked for one)
    const pic = events.find((e) => e.type === 'result' && e.call.name === 'render_png');
    expect(pic?.type === 'result' && pic.result.content.some((c) => c.type === 'image')).toBe(true);
    // the words streamed without any call's JSON
    const texts = events.flatMap((e) => (e.type === 'text' ? [e.text] : []));
    expect(texts.every((t) => !/"name"|"arguments"/.test(t))).toBe(true);
    expect(texts[texts.length - 1].replace(/\s+/g, ' ')).toBe(
      'I will wall it in first. Now let me look at it. And another wall: then a sketch That is the level.',
    );
    // each call's line shows up before it runs
    const order = events
      .filter((e) => e.type === 'call' || e.type === 'result')
      .map((e) => `${e.type} ${e.type === 'call' || e.type === 'result' ? e.call.name : ''}`);
    expect(order.slice(0, 2)).toEqual(['call set_map', 'result set_map']);
    // the context holds one reply with the four calls and their results, in order
    const reply = agent.messages.find((m) => m.role === 'assistant' && m.toolCalls?.length);
    expect(reply?.role === 'assistant' && reply.toolCalls?.map((c) => c.name)).toEqual(['set_map', 'render_png', 'set_map', 'map_sketch']);
  });

  it('native calls from the stream run as soon as they are complete', async () => {
    const ctx = game();
    const log: string[] = [];
    let turn = 0;
    const chat = async (req: ChatRequest): Promise<ChatReply> => {
      if (turn++) return { content: 'ok', toolCalls: [] };
      const a = { id: 'a', name: 'map_sketch', args: { file: 'test.map', width: 8, height: 3 } };
      const b = { id: 'b', name: 'game_summary', args: {} };
      req.onToolCall?.(a);
      log.push('stream goes on');
      await tick();
      await tick();
      req.onToolCall?.(b);
      await tick();
      log.push('stream ends');
      return { content: '', toolCalls: [a, b] };
    };
    const agent = new Agent({ chat, tools: chatTools(ctx), system: () => 'S', images: () => false, limit: () => 32000 });
    await agent.send('look', { onEvent: (e) => e.type === 'result' && log.push(`ran ${e.call.name}`) });
    expect(log).toEqual(['stream goes on', 'ran map_sketch', 'ran game_summary', 'stream ends']);
    // each ran once
    expect(agent.messages.filter((m) => m.role === 'tool')).toHaveLength(2);
  });

  it('Stop cancels the calls not yet run', async () => {
    const ctx = game();
    const log: string[] = [];
    const stop = new AbortController();
    const agent = new Agent({
      chat: streamingModel(log, { piece: 3, stop }),
      tools: chatTools(ctx),
      system: () => 'S',
      images: () => true,
      limit: () => 32000,
    });
    const ran: string[] = [];
    await expect(
      agent.send('go', {
        signal: stop.signal,
        onEvent: (e) => e.type === 'result' && ran.push(`${e.call.name}: ${e.result.content[0]?.type === 'text' ? e.result.content[0].text.slice(0, 20) : ''}`),
      }),
    ).rejects.toThrow();
    // the first set_map ran; the render that arrived with the Stop didn't
    expect(ran[0]).toMatch(/^set_map: Applied/);
    expect(ran.slice(1).every((r) => /Stopped/.test(r))).toBe(true);
    expect(log).not.toContain('piece 5');
    const map = parseMap(ctx.files.get('test.map')!);
    expect(map.blocks[104]).not.toBe(1);
  });
});
