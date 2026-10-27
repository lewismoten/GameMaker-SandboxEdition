// Keeping within the context: the gauge's numbers (reported or estimated), compaction (when it
// happens, what stays word for word, the model's summary or the plain one), big results cut to
// their budget, Reset keeping the archive, and recall finding the archived turns.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { testGame } from '../../editor/check/testGame';
import { MemoryContext } from '../tools/memoryContext';
import { Agent, type AgentEvent } from './agent';
import { Archive, recallText } from './archive';
import { chatTools } from './chatTools';
import { fixedSummary, splitForCompaction } from './compact';
import type { ChatMessage, ChatReply, ChatRequest } from './providers';
import { estimateTokens, gaugeFill, gaugeText, kTokens, messagesTokens, toolsTokens } from './tokens';

const ctx = () => new MemoryContext(new GameFiles(testGame(['########', '#S....E#', '########']).files), 'test.gam');

/** A model answering from a script, keeping what it was sent and its size. */
function scripted(replies: (ChatReply | ((req: ChatRequest) => ChatReply))[]) {
  const sent: { messages: ChatMessage[]; tokens: number; tools: string[] }[] = [];
  return {
    sent,
    chat: async (req: ChatRequest): Promise<ChatReply> => {
      sent.push({
        messages: req.messages.map((m) => ({ ...m })),
        tokens: messagesTokens(req.messages) + toolsTokens(req.tools),
        tools: req.tools.map((t) => t.function.name),
      });
      const r = replies.shift() ?? { content: 'Done.', toolCalls: [] };
      return typeof r === 'function' ? r(req) : r;
    },
  };
}
const call = (name: string, args: Record<string, unknown> = {}): ChatReply => ({ content: '', toolCalls: [{ id: `c${Math.random()}`, name, args }] });

describe('the gauge', () => {
  it('says how much is used, estimated or reported', () => {
    expect(estimateTokens('x'.repeat(400))).toBe(100);
    expect(kTokens(3140)).toBe('3.1k');
    expect(kTokens(812)).toBe('812');
    expect(gaugeText({ used: 3140, limit: 8192, reported: false })).toBe('3.1k / 8.2k tokens (estimated)');
    expect(gaugeText({ used: 2000, limit: 4096, reported: true })).toBe('2k / 4.1k tokens');
    expect(gaugeFill({ used: 9000, limit: 8000, reported: true })).toBe(1);
  });

  it('takes the provider’s count when it gives one, else the estimate', async () => {
    const events: AgentEvent[] = [];
    const m = scripted([
      { content: 'Hi.', toolCalls: [], usage: { prompt: 1234, completion: 16 } },
      { content: 'Again.', toolCalls: [] },
    ]);
    const agent = new Agent({ chat: m.chat, tools: chatTools(ctx()), system: () => 'sys', images: () => false, limit: () => 8192 });
    await agent.send('hello', { onEvent: (e) => events.push(e) });
    await agent.send('again', { onEvent: (e) => events.push(e) });
    const g = events.flatMap((e) => (e.type === 'gauge' ? [e.gauge] : []));
    expect(g[0]).toEqual({ used: 1250, limit: 8192, reported: true });
    expect(g[1].reported).toBe(false);
    expect(g[1].used).toBe(m.sent[1].tokens + estimateTokens('Again.'));
  });
});

describe('compaction', () => {
  it('splits off all but the last requests, word for word', () => {
    const ms: ChatMessage[] = [
      { role: 'user', content: 'one' },
      { role: 'assistant', content: 'a' },
      { role: 'user', content: 'pic', images: ['x'] },
      { role: 'user', content: 'two' },
      { role: 'assistant', content: 'b' },
      { role: 'user', content: 'three' },
    ];
    const { old, kept } = splitForCompaction(ms, 2);
    expect(old.map((m) => m.content)).toEqual(['one', 'a', 'pic']);
    expect(kept.map((m) => m.content)).toEqual(['two', 'b', 'three']);
    expect(splitForCompaction(ms.slice(0, 2), 2).old).toEqual([]);
  });

  it('writes a plain summary: the goal, the changes, what was said, the open to-dos', () => {
    const s = fixedSummary(
      [
        { role: 'user', content: 'Make a penguin game' },
        { role: 'assistant', content: '', toolCalls: [{ id: '1', name: 'set_map', args: {} }] },
        { role: 'tool', callId: '1', name: 'set_map', content: 'Applied: Map level.map: 12 cells, 0 monsters placed. Files: level.map (22000 bytes).' },
        { role: 'assistant', content: 'I drew the ice.' },
        { role: 'user', content: 'Add fish' },
      ],
      '',
      ['Name the keys'],
    );
    expect(s).toBe(
      'Goal: Make a penguin game\nThen asked: Add fish\nChanged: Map level.map: 12 cells, 0 monsters placed\nSaid: I drew the ice.\nOpen to-dos: Name the keys',
    );
  });

  it('happens on its own near the limit: the system prompt and the last requests stay, the rest goes to the archive', async () => {
    const events: AgentEvent[] = [];
    const big = 'w'.repeat(2400);
    // each request is about 600 tokens; a 4k context fills by the fourth
    const m = scripted([]);
    const agent = new Agent({
      chat: m.chat,
      tools: chatTools(ctx()),
      system: () => 'SYSTEM PROMPT',
      images: () => false,
      limit: () => 4096,
      todos: () => ['Add an exit'],
    });
    for (let i = 1; i <= 6; i++) await agent.send(`request ${i} ${big}`, { onEvent: (e) => events.push(e) });
    const compacted = events.filter((e) => e.type === 'compacted');
    expect(compacted.length).toBeGreaterThan(0);
    // a 4k model writes no summary: the plain one
    expect(compacted.every((e) => e.type === 'compacted' && e.how === 'fixed')).toBe(true);
    for (const s of m.sent) {
      expect(s.messages[0].content.startsWith('SYSTEM PROMPT')).toBe(true);
      expect(s.tokens).toBeLessThanOrEqual(4096 - 819);
    }
    const last = m.sent[m.sent.length - 1].messages;
    expect(last[0].content).toMatch(/Earlier in this chat[\s\S]*Goal: request 1[\s\S]*Open to-dos: Add an exit/);
    expect(last[last.length - 1].content).toMatch(/^request 6/);
    expect(agent.archive.entries.filter((e) => e.role === 'user')).toHaveLength(6);
  });

  it('has the model write the summary when there is room, and on Compact now', async () => {
    const m = scripted([
      { content: 'One.', toolCalls: [] },
      { content: 'Two.', toolCalls: [] },
      { content: 'Three.', toolCalls: [] },
      { content: 'Goal: a kite game. Changed: nothing yet.', toolCalls: [] },
    ]);
    const agent = new Agent({ chat: m.chat, tools: chatTools(ctx()), system: () => 'S', images: () => false, limit: () => 16000 });
    for (const t of ['kite game please', 'make it windy', 'and a tree']) await agent.send(t);
    expect(await agent.compact()).toBe(true);
    expect(agent.summary).toBe('Goal: a kite game. Changed: nothing yet.');
    expect(m.sent[3].messages[0].content).toMatch(/Summarize this chat/);
    expect(agent.messages[0]).toEqual({ role: 'user', content: 'make it windy' });
    // nothing more to put away
    expect(await agent.compact()).toBe(false);
  });

  it('cuts a big result to its budget, with a note to ask for less; the archive keeps it whole', async () => {
    const c = ctx();
    const m = scripted([call('get_map', { file: 'test.map' })]);
    const agent = new Agent({ chat: m.chat, tools: chatTools(c), system: () => 'S', images: () => false, limit: () => 4096 });
    await agent.send('show the whole map as numbers');
    const tool = agent.messages.find((x) => x.role === 'tool')!;
    expect(tool.content.length).toBeLessThan(2200);
    expect(tool.content).toMatch(/narrower range/);
    expect(agent.archive.entries.find((e) => e.role === 'tool')!.text.length).toBeGreaterThan(5000);
  });
});

describe('Reset and recall', () => {
  it('Reset empties the context but keeps the archive; recall searches it and reads turns', async () => {
    const m = scripted([
      { content: 'The penguin likes herring.', toolCalls: [] },
      { content: 'Snow added.', toolCalls: [] },
      call('recall', { query: 'herring' }),
      { content: 'It was herring.', toolCalls: [] },
    ]);
    const agent = new Agent({ chat: m.chat, tools: chatTools(ctx()), system: () => 'S', images: () => false, limit: () => 8192 });
    await agent.send('What fish does the penguin like?');
    await agent.send('Add snow');
    agent.reset();
    expect(agent.messages).toEqual([]);
    await agent.send('What fish was it again?');
    const recalled = agent.messages.find((x) => x.role === 'tool')!.content;
    expect(recalled).toMatch(/\[turn 1 assistant\] The penguin likes herring/);
    // turns keep counting after a reset
    expect(agent.archive.lastTurn).toBe(3);
  });

  it('recall finds by words, newest first among equals, and reads a turn range', () => {
    const a = new Archive();
    a.add({ turn: 1, role: 'user', text: 'Make an icy cave level' });
    a.add({ turn: 1, role: 'tool', name: 'set_map', text: `Applied: Map cave.map ${'x'.repeat(500)} icy floor` });
    a.add({ turn: 2, role: 'user', text: 'Add fish pickups' });
    expect(recallText(a, { query: 'icy' }).split('\n')[0]).toMatch(/^\[turn 1 tool set_map\]/);
    expect(recallText(a, { query: 'banana' })).toMatch(/Nothing in the archive mentions/);
    expect(recallText(a, { from_turn: 2, to_turn: 2 })).toBe('[turn 2 user] Add fish pickups');
    expect(recallText(new Archive(), { query: 'x' })).toMatch(/empty/);
  });
});

describe('forgiving small models', () => {
  it('takes numbers as strings and several groups at once', async () => {
    const c = ctx();
    const m = scripted([
      call('load_tools', { group: 'maps, blocks,nonsense' }),
      call('set_map', { file: 'test.map', x: '2', y: '1', rows: '[[1, 1]]' }),
      { content: 'Done.', toolCalls: [] },
    ]);
    const agent = new Agent({ chat: m.chat, tools: chatTools(c), system: () => 'S', images: () => false, limit: () => 8192 });
    await agent.send('wall');
    const results = agent.messages.filter((x) => x.role === 'tool').map((x) => x.content);
    expect(results[0]).toMatch(/^Loaded maps: map_sketch, get_map, set_map; blocks: list_blocks, get_block, set_block\. \(No group nonsense\.\)/);
    expect(results[1]).toMatch(/^Applied: Map test.map: 2 cells/);
    expect(agent.toolset.loadedIds.sort()).toEqual(['blocks', 'maps']);
  });
});
