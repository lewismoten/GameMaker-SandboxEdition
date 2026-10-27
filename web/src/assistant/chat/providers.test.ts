// The provider adapters against fixtures: the request bodies for OpenAI's Chat Completions and
// Ollama's /api/chat, whole and streamed replies with tool calls (split across stream events as
// OpenAI sends them), model lists, and a tool call a small model wrote as text.
import { describe, expect, it } from 'vitest';
import {
  OllamaStream,
  OpenAIStream,
  chat,
  chatUrl,
  listModels,
  ollamaBody,
  openaiBody,
  parseOllamaReply,
  parseOpenAIReply,
  type ChatMessage,
} from './providers';
import { defaultSettings } from './settings';
import { toOpenAITools } from '../openai';

const href = (u: string | URL | Request) => (typeof u === 'string' ? u : u instanceof URL ? u.href : u.url);

const tools = toOpenAITools([{ name: 'get_map', description: 'A map region.', inputSchema: { type: 'object', properties: { file: { type: 'string' } } } }]);
const history: ChatMessage[] = [
  { role: 'system', content: 'Be brief.' },
  { role: 'user', content: 'Look at the map.' },
  { role: 'assistant', content: '', toolCalls: [{ id: 'c1', name: 'get_map', args: { file: 'a.map' } }] },
  { role: 'tool', callId: 'c1', name: 'get_map', content: '{"rows":[[1]]}' },
  { role: 'user', content: 'The picture.', images: ['iVBORw0KGgo='] },
];

/** A Response whose body streams these chunks. */
const streamed = (chunks: string[], type: string) =>
  new Response(
    new ReadableStream({
      start(c) {
        for (const s of chunks) c.enqueue(new TextEncoder().encode(s));
        c.close();
      },
    }),
    { headers: { 'content-type': type } },
  );

describe('request bodies', () => {
  it('OpenAI: tool calls with JSON string arguments, tool results by id, pictures as data URLs', () => {
    const b = openaiBody('gpt-4o', history, tools, true) as { messages: Record<string, unknown>[]; tools: unknown; stream: boolean };
    expect(b.stream).toBe(true);
    expect(b.tools).toEqual(tools);
    expect(b.messages[2]).toEqual({
      role: 'assistant',
      content: null,
      tool_calls: [{ id: 'c1', type: 'function', function: { name: 'get_map', arguments: '{"file":"a.map"}' } }],
    });
    expect(b.messages[3]).toEqual({ role: 'tool', tool_call_id: 'c1', content: '{"rows":[[1]]}' });
    expect(b.messages[4]).toEqual({
      role: 'user',
      content: [
        { type: 'text', text: 'The picture.' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=' } },
      ],
    });
  });

  it('Ollama: object arguments, tool results by name, pictures as base64, the context size', () => {
    const b = ollamaBody('qwen3', history, tools, true, 16384) as { messages: Record<string, unknown>[]; options: unknown };
    expect(b.messages[2]).toEqual({ role: 'assistant', content: '', tool_calls: [{ function: { name: 'get_map', arguments: { file: 'a.map' } } }] });
    expect(b.messages[3]).toEqual({ role: 'tool', content: '{"rows":[[1]]}', tool_name: 'get_map' });
    expect(b.messages[4]).toEqual({ role: 'user', content: 'The picture.', images: ['iVBORw0KGgo='] });
    expect(b.options).toEqual({ num_ctx: 16384 });
  });

  it('addresses: Ollama’s /api/chat whatever was typed after it, and /v1/chat/completions', () => {
    expect(chatUrl({ provider: 'ollama', baseUrl: 'http://box:11434/v1/' })).toBe('http://box:11434/api/chat');
    expect(chatUrl({ provider: 'openai', baseUrl: 'http://localhost:1234/v1/chat/completions' })).toBe('http://localhost:1234/v1/chat/completions');
    expect(chatUrl({ provider: 'openai', baseUrl: 'https://api.openai.com/v1' })).toBe('https://api.openai.com/v1/chat/completions');
  });
});

describe('replies', () => {
  it('whole replies of both shapes', () => {
    expect(
      parseOpenAIReply({
        choices: [{ message: { content: null, tool_calls: [{ id: 'x', type: 'function', function: { name: 'get_map', arguments: '{"file":"a.map"}' } }] } }],
      }),
    ).toEqual({ content: '', toolCalls: [{ id: 'x', name: 'get_map', args: { file: 'a.map' } }] });
    const o = parseOllamaReply({
      message: { role: 'assistant', content: '<think>hmm</think>Done.', tool_calls: [{ function: { name: 'get_map', arguments: { file: 'b.map' } } }] },
    });
    expect(o.content).toBe('Done.');
    expect(o.toolCalls[0]).toMatchObject({ name: 'get_map', args: { file: 'b.map' } });
  });

  it('OpenAI’s stream: words, and a tool call whose arguments arrive in pieces', () => {
    const s = new OpenAIStream();
    const seen: (string | undefined)[] = [];
    for (const l of [
      'data: {"choices":[{"delta":{"role":"assistant","content":"Look"}}]}',
      'data: {"choices":[{"delta":{"content":"ing."}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"get_map","arguments":""}}]}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"file\\":"}}]}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"a.map\\"}"}}]}}]}',
      ': keep-alive',
      'data: [DONE]',
    ])
      seen.push(s.line(l));
    expect(seen.filter(Boolean)).toEqual(['Look', 'Looking.']);
    expect(s.reply()).toEqual({ content: 'Looking.', toolCalls: [{ id: 'call_1', name: 'get_map', args: { file: 'a.map' } }] });
  });

  it('Ollama’s stream: lines of JSON, the tool call whole', () => {
    const s = new OllamaStream();
    s.line('{"message":{"role":"assistant","content":"Sure"},"done":false}');
    s.line('{"message":{"role":"assistant","content":"","tool_calls":[{"function":{"name":"get_map","arguments":{"file":"c.map"}}}]},"done":false}');
    s.line('{"message":{"role":"assistant","content":""},"done":true}');
    const r = s.reply();
    expect(r.content).toBe('Sure');
    expect(r.toolCalls).toMatchObject([{ name: 'get_map', args: { file: 'c.map' } }]);
  });

  it('arguments that are not JSON are kept to be refused, not guessed at', () => {
    const r = parseOpenAIReply({ choices: [{ message: { tool_calls: [{ id: 'y', function: { name: 'get_map', arguments: '{file: a.map' } }] } }] });
    expect(r.toolCalls[0].badArgs).toBe('{file: a.map');
  });
});

describe('calls', () => {
  it('chat() streams from Ollama and sends no key when there is none', async () => {
    let sent: RequestInit | undefined;
    let url = '';
    const words: string[] = [];
    const r = await chat(
      { ...defaultSettings('ollama'), model: 'qwen3' },
      { messages: history.slice(0, 2), tools, onText: (t) => words.push(t) },
      async (u, init) => {
        url = href(u);
        sent = init;
        return streamed(['{"message":{"content":"Hel"}}\n{"message":{"con', 'tent":"lo"}}\n{"done":true}\n'], 'application/x-ndjson');
      },
    );
    expect(url).toBe('http://localhost:11434/api/chat');
    expect((sent!.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(JSON.parse(sent!.body as string)).toMatchObject({ model: 'qwen3', stream: true });
    expect(r.content).toBe('Hello');
    expect(words).toEqual(['Hel', 'Hello']);
  });

  it('chat() reads OpenAI’s server-sent events, with the key', async () => {
    let auth = '';
    const r = await chat({ ...defaultSettings('openai'), model: 'gpt-4o', apiKey: 'sk-test' }, { messages: history.slice(0, 2), tools }, async (_u, init) => {
      auth = (init!.headers as Record<string, string>).Authorization;
      return streamed(
        [
          'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"a","function":{"name":"get_map","arguments":"{}"}}]}}]}\n\n',
          'data: {"choices":[{"delta":{"tool_calls":[{"index":1,"id":"b","function":{"name":"get_map","arguments":"{\\"file\\":\\"x.map\\"}"}}]}}]}\n\ndata: [DONE]\n\n',
        ],
        'text/event-stream',
      );
    });
    expect(auth).toBe('Bearer sk-test');
    expect(r.toolCalls.map((c) => c.id)).toEqual(['a', 'b']);
    expect(r.toolCalls[1].args).toEqual({ file: 'x.map' });
  });

  it('chat() takes a whole JSON answer from a server that doesn’t stream', async () => {
    const r = await chat({ ...defaultSettings('openai'), model: 'm' }, { messages: [], tools }, async () =>
      Response.json({ choices: [{ message: { content: 'Hi there' } }] }),
    );
    expect(r).toEqual({ content: 'Hi there', toolCalls: [] });
  });

  it('lists models from /api/tags and /v1/models', async () => {
    const f = (async (u: string | URL | Request) =>
      href(u).endsWith('/api/tags')
        ? Response.json({ models: [{ name: 'qwen3:8b' }, { name: 'llama3.1:latest' }] })
        : Response.json({ data: [{ id: 'gpt-4o' }, { id: 'gpt-4.1-mini' }] })) as typeof fetch;
    expect(await listModels(defaultSettings('ollama'), f)).toEqual(['llama3.1:latest', 'qwen3:8b']);
    expect(await listModels(defaultSettings('openai'), f)).toEqual(['gpt-4.1-mini', 'gpt-4o']);
  });
});
