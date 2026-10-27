// The chat's loop with a fake model: tool calls run and their results go back; in "Ask before
// changing" a skipped change leaves the game as it was and the model is told so; pictures go
// back to a model that sees and are described to one that doesn't; Stop ends the turn; and the
// history is trimmed to fit.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { testGame } from '../../editor/check/testGame';
import { MemoryContext } from '../tools/memoryContext';
import { Agent, SKIPPED } from './agent';
import { chatTools } from './chatTools';
import { trimHistory } from './trim';
import type { ChatMessage, ChatReply, ChatRequest, ToolCall } from './providers';

const tiny = () => new MemoryContext(new GameFiles(testGame(['########', '#......#', '#S..cE.#', '########']).files), 'test.gam');

/** A model that answers from a script, one reply a turn, keeping what it was sent. */
function scripted(replies: ChatReply[]) {
  const seen: ChatMessage[][] = [];
  return {
    seen,
    chat: async (req: ChatRequest) => {
      seen.push(req.messages.map((m) => ({ ...m })));
      return replies.shift() ?? { content: 'Done.', toolCalls: [] };
    },
  };
}
const calls = (...c: [string, Record<string, unknown>][]): ChatReply => ({
  content: '',
  toolCalls: c.map(([name, args], i): ToolCall => ({ id: `c${i}`, name, args })),
});

const agentOn = (ctx: MemoryContext, chat: (r: ChatRequest) => Promise<ChatReply>, images = false) =>
  new Agent({ chat, tools: chatTools(ctx, 'all'), system: () => 'system', images: () => images, budget: () => 100_000 });

describe('the chat loop', () => {
  it('asks before a change: Apply makes it, Skip leaves the game alone and tells the model', async () => {
    const ctx = tiny();
    const before = ctx.files.get('test.map');
    const m = scripted([
      calls(['set_map', { file: 'test.map', x: 1, y: 1, rows: [[1, 1]] }], ['get_map', { file: 'test.map', x: 0, y: 0, width: 3, height: 2 }]),
      { content: 'I left the map alone.', toolCalls: [] },
    ]);
    const asked: string[] = [];
    const agent = agentOn(ctx, m.chat);
    const reply = await agent.send('Wall it in', { approve: async (c) => (asked.push(c.name), false) });
    expect(reply).toBe('I left the map alone.');
    // only the write was asked about, and it changed nothing
    expect(asked).toEqual(['set_map']);
    expect(ctx.files.get('test.map')).toBe(before);
    const results = m.seen[1].filter((x) => x.role === 'tool');
    expect(results.map((x) => x.content)).toEqual([SKIPPED, expect.stringContaining('"rows"')]);

    const m2 = scripted([calls(['set_map', { file: 'test.map', x: 1, y: 1, rows: [[1, 1]] }])]);
    await agentOn(ctx, m2.chat).send('Wall it in', { approve: async () => true });
    expect(ctx.files.get('test.map')).not.toBe(before);
    expect(ctx.dirty.has('test.map')).toBe(true);
  });

  it('a dry run is never asked about, and a read-only game refuses changes', async () => {
    const ctx = tiny();
    ctx.readOnly = true;
    const m = scripted([calls(['set_map', { file: 'test.map', rows: [[1]], dry_run: true }], ['set_map', { file: 'test.map', rows: [[1]] }])]);
    let asked = 0;
    await agentOn(ctx, m.chat).send('Try', { approve: async () => (asked++, true) });
    expect(asked).toBe(1);
    const results = m.seen[1].filter((x) => x.role === 'tool').map((x) => x.content);
    expect(results[0]).toMatch(/Dry run/);
    expect(results[1]).toMatch(/read-only/);
  });

  it('pictures go to a model that sees, and are described to one that doesn’t', async () => {
    for (const sees of [true, false]) {
      const ctx = tiny();
      const m = scripted([calls(['render_png', { what: 'map', file: 'test.map', width: 8, height: 4 }])]);
      await agentOn(ctx, m.chat, sees).send('Show me');
      const sent = m.seen[1];
      const pic = sent.find((x) => x.role === 'user' && x.images?.length);
      const tool = sent.find((x) => x.role === 'tool')!;
      if (sees) {
        expect(pic).toBeDefined();
        expect(tool.content).toMatch(/picture is in the next message/);
      } else {
        expect(pic).toBeUndefined();
        expect(tool.content).toMatch(/can’t see pictures/);
      }
    }
  });

  it('unknown tools and bad arguments come back as errors the model can fix', async () => {
    const ctx = tiny();
    const m = scripted([
      {
        content: '',
        toolCalls: [
          { id: 'a', name: 'paint_everything', args: {} },
          { id: 'b', name: 'get_map', args: {}, badArgs: '{oops' },
        ],
      },
    ]);
    await agentOn(ctx, m.chat).send('Go');
    const results = m.seen[1].filter((x) => x.role === 'tool').map((x) => x.content);
    expect(results[0]).toMatch(/^Error: There is no tool paint_everything/);
    expect(results[1]).toMatch(/weren’t a JSON object/);
  });

  it('Stop ends the turn; every call it made still gets an answer', async () => {
    const ctx = tiny();
    const stop = new AbortController();
    const m = scripted([calls(['set_map', { file: 'test.map', rows: [[1]] }], ['get_map', { file: 'test.map' }])]);
    const agent = agentOn(ctx, m.chat);
    await expect(agent.send('Go', { signal: stop.signal, approve: async () => (stop.abort(), false) })).rejects.toThrow();
    const tools = agent.messages.filter((x) => x.role === 'tool');
    expect(tools).toHaveLength(2);
    expect(tools.every((x) => /Stopped/.test(x.content))).toBe(true);
  });
});

describe('trimming the history', () => {
  it('cuts old results short, drops old pictures, then whole old exchanges, keeping the system message', () => {
    const big = 'x'.repeat(5000);
    const msgs: ChatMessage[] = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'one' },
      { role: 'assistant', content: '', toolCalls: [{ id: '1', name: 'get_map', args: {} }] },
      { role: 'tool', callId: '1', name: 'get_map', content: big },
      { role: 'user', content: 'pic', images: ['AAAA'] },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: 'two' },
      { role: 'assistant', content: '', toolCalls: [{ id: '2', name: 'get_map', args: {} }] },
      { role: 'tool', callId: '2', name: 'get_map', content: big },
    ];
    const t = trimHistory(msgs, 100_000);
    expect(t[3].content.length).toBeLessThan(500);
    expect(t[8].content).toBe(big);
    expect(t[4]).toEqual({ role: 'user', content: 'pic (picture no longer shown)', images: [] });
    const small = trimHistory(msgs, 5200);
    expect(small[0].content).toBe('sys');
    expect(small[1]).toEqual({ role: 'user', content: 'two' });
    expect(small).toHaveLength(4);
  });
});
