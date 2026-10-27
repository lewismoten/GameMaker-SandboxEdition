// Talking to the person's own model with plain fetch: OpenAI's Chat Completions shape
// (/v1/chat/completions, which OpenAI, LM Studio, llama.cpp's server and Ollama's /v1 all take)
// and Ollama's own /api/chat, which takes pictures as plain base64 and streams lines of JSON.
// The chat keeps one neutral message list (ChatMessage); each adapter turns it into its wire
// shape and the answer (streamed or whole) back into words and tool calls. The key is sent only
// to the address in the settings.
import type { OpenAITool } from '../openai';
import type { AiSettings } from './settings';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  /** The arguments as sent, when they were not a JSON object. */
  badArgs?: string;
}

export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string; images?: string[] }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; callId: string; name: string; content: string };

export interface ChatRequest {
  messages: ChatMessage[];
  tools: OpenAITool[];
  signal?: AbortSignal;
  /** Hears the reply's words so far, as they stream in. */
  onText?: (soFar: string) => void;
  /** Hears each native tool call as soon as it is complete, while the reply streams on. */
  onToolCall?: (c: ToolCall) => void;
  /** Ollama: turn a thinking model's thinking on or off (left out: the model's default). */
  think?: boolean;
}

export interface ChatReply {
  content: string;
  toolCalls: ToolCall[];
  /** The provider's own token counts, when it gave them. */
  usage?: Usage;
}

/** An answer that was not OK: its status and what the server said. */
export class ProviderError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`HTTP ${status}${body ? `: ${body.slice(0, 300)}` : ''}`);
  }
}

type Fetch = typeof fetch;

// ---- addresses ---------------------------------------------------------------------------------

/** Ollama's root, without a /v1 or /api someone typed after it. */
export function ollamaRoot(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/(v1|api)(\/.*)?$/, '');
}

/** An OpenAI-compatible base ending in /v1 (or whatever the person typed), without /chat/completions. */
export function openaiBase(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/chat\/completions$/, '')
    .replace(/\/models$/, '');
}

export function chatUrl(s: Pick<AiSettings, 'provider' | 'baseUrl'>): string {
  return s.provider === 'ollama' ? `${ollamaRoot(s.baseUrl)}/api/chat` : `${openaiBase(s.baseUrl)}/chat/completions`;
}

export function modelsUrl(s: Pick<AiSettings, 'provider' | 'baseUrl'>): string {
  return s.provider === 'ollama' ? `${ollamaRoot(s.baseUrl)}/api/tags` : `${openaiBase(s.baseUrl)}/models`;
}

function headers(s: Pick<AiSettings, 'apiKey'>, json = true): Record<string, string> {
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(s.apiKey.trim() ? { Authorization: `Bearer ${s.apiKey.trim()}` } : {}) };
}

// ---- request bodies -----------------------------------------------------------------------------

const png = (b64: string) => `data:image/png;base64,${b64}`;

export function openaiBody(model: string, messages: ChatMessage[], tools: OpenAITool[], stream: boolean): Record<string, unknown> {
  return {
    model,
    stream,
    // the token counts come in the last event
    ...(stream ? { stream_options: { include_usage: true } } : {}),
    messages: messages.map((m) => {
      switch (m.role) {
        case 'user':
          return m.images?.length
            ? { role: 'user', content: [{ type: 'text', text: m.content }, ...m.images.map((i) => ({ type: 'image_url', image_url: { url: png(i) } }))] }
            : { role: 'user', content: m.content };
        case 'assistant':
          return m.toolCalls?.length
            ? {
                role: 'assistant',
                content: m.content || null,
                tool_calls: m.toolCalls.map((c) => ({
                  id: c.id,
                  type: 'function',
                  function: { name: c.name, arguments: c.badArgs ?? JSON.stringify(c.args) },
                })),
              }
            : { role: 'assistant', content: m.content };
        case 'tool':
          return { role: 'tool', tool_call_id: m.callId, content: m.content };
        default:
          return { role: 'system', content: m.content };
      }
    }),
    ...(tools.length ? { tools } : {}),
  };
}

export function ollamaBody(
  model: string,
  messages: ChatMessage[],
  tools: OpenAITool[],
  stream: boolean,
  contextTokens?: number,
  think?: boolean,
): Record<string, unknown> {
  return {
    model,
    stream,
    ...(think === undefined ? {} : { think }),
    messages: messages.map((m) => {
      switch (m.role) {
        case 'user':
          return { role: 'user', content: m.content, ...(m.images?.length ? { images: m.images } : {}) };
        case 'assistant':
          return {
            role: 'assistant',
            content: m.content,
            ...(m.toolCalls?.length ? { tool_calls: m.toolCalls.map((c) => ({ function: { name: c.name, arguments: c.args } })) } : {}),
          };
        case 'tool':
          return { role: 'tool', content: m.content, tool_name: m.name };
        default:
          return { role: 'system', content: m.content };
      }
    }),
    ...(tools.length ? { tools } : {}),
    ...(contextTokens ? { options: { num_ctx: contextTokens } } : {}),
  };
}

// ---- answers ------------------------------------------------------------------------------------

let callCount = 0;
const newId = () => `call_${Date.now().toString(36)}_${++callCount}`;

/** Arguments as sent: a JSON string (OpenAI) or an object (Ollama). */
function argsOf(raw: unknown): Pick<ToolCall, 'args' | 'badArgs'> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return { args: raw as Record<string, unknown> };
  if (typeof raw === 'string') {
    if (!raw.trim()) return { args: {} };
    try {
      const v: unknown = JSON.parse(raw);
      if (v && typeof v === 'object' && !Array.isArray(v)) return { args: v as Record<string, unknown> };
    } catch {
      /* below */
    }
    return { args: {}, badArgs: raw };
  }
  return { args: {} };
}

/** A reply's words without a thinking model's <think>…</think>. */
export function stripThinking(s: string): string {
  return s.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').replace(/^\s+/, '');
}

interface OpenAIToolCallWire {
  index?: number;
  id?: string;
  function?: { name?: string; arguments?: unknown };
}

/** A whole (not streamed) Chat Completions answer. */
export function parseOpenAIReply(body: unknown): ChatReply {
  const b = body as {
    choices?: { message?: { content?: string | null; tool_calls?: OpenAIToolCallWire[] } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const msg = b.choices?.[0]?.message;
  return {
    content: stripThinking(msg?.content ?? ''),
    toolCalls: (msg?.tool_calls ?? []).map((c) => ({ id: c.id || newId(), name: c.function?.name ?? '', ...argsOf(c.function?.arguments) })),
    ...(b.usage?.prompt_tokens !== undefined ? { usage: { prompt: b.usage.prompt_tokens, completion: b.usage.completion_tokens ?? 0 } } : {}),
  };
}

/** A whole (not streamed) /api/chat answer. */
export function parseOllamaReply(body: unknown): ChatReply {
  const b = body as { message?: { content?: string; tool_calls?: OpenAIToolCallWire[] }; prompt_eval_count?: number; eval_count?: number };
  const msg = b.message;
  return {
    content: stripThinking(msg?.content ?? ''),
    toolCalls: (msg?.tool_calls ?? []).map((c) => ({ id: c.id || newId(), name: c.function?.name ?? '', ...argsOf(c.function?.arguments) })),
    ...(b.prompt_eval_count !== undefined ? { usage: { prompt: b.prompt_eval_count, completion: b.eval_count ?? 0 } } : {}),
  };
}

/** The provider's token counts for one call. */
export interface Usage {
  prompt: number;
  completion: number;
}

/** Builds a reply from Chat Completions stream events (the JSON after each "data: "). A tool call is handed on once the next one starts, or the stream ends. */
export class OpenAIStream {
  private text = '';
  private calls: { id: string; name: string; args: string }[] = [];
  private handed = 0;
  private usage?: Usage;

  constructor(private readonly onCall?: (c: ToolCall) => void) {}

  private done: ToolCall[] = [];

  /** Call `i` as finished (made once, so its id stays the same). */
  private call(i: number): ToolCall {
    const c = this.calls[i];
    return (this.done[i] ??= { id: c.id || newId(), name: c.name, ...argsOf(c.args) });
  }

  /** Hands on the calls before index `upTo`. */
  private handOn(upTo: number): void {
    for (; this.handed < upTo; this.handed++) if (this.calls[this.handed]) this.onCall?.(this.call(this.handed));
  }

  /** Takes one SSE line; returns the words so far when they changed. */
  line(l: string): string | undefined {
    const t = l.trim();
    if (!t.startsWith('data:')) return undefined;
    const data = t.slice(5).trim();
    if (!data || data === '[DONE]') return undefined;
    let ev: {
      choices?: { delta?: { content?: string | null; tool_calls?: OpenAIToolCallWire[] } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
      error?: { message?: string };
    };
    try {
      ev = JSON.parse(data) as typeof ev;
    } catch {
      return undefined;
    }
    if (ev.error) throw new ProviderError(200, ev.error.message ?? JSON.stringify(ev.error));
    if (ev.usage?.prompt_tokens !== undefined) this.usage = { prompt: ev.usage.prompt_tokens, completion: ev.usage.completion_tokens ?? 0 };
    const d = ev.choices?.[0]?.delta;
    if (!d) return undefined;
    for (const c of d.tool_calls ?? []) {
      const i = c.index ?? this.calls.length;
      this.handOn(i);
      const at = (this.calls[i] ??= { id: '', name: '', args: '' });
      if (c.id) at.id = c.id;
      if (c.function?.name) at.name += c.function.name;
      if (typeof c.function?.arguments === 'string') at.args += c.function.arguments;
      else if (c.function?.arguments) at.args = JSON.stringify(c.function.arguments);
    }
    if (d.content) {
      this.text += d.content;
      return stripThinking(this.text);
    }
    return undefined;
  }

  reply(): ChatReply {
    this.handOn(this.calls.length);
    return {
      content: stripThinking(this.text),
      toolCalls: this.calls.flatMap((c, i) => (c ? [this.call(i)] : [])),
      ...(this.usage ? { usage: this.usage } : {}),
    };
  }
}

/** Builds a reply from /api/chat's stream (one JSON object a line); its tool calls come whole, so each is handed on at once. */
export class OllamaStream {
  private text = '';
  private calls: ToolCall[] = [];
  private usage?: Usage;

  constructor(private readonly onCall?: (c: ToolCall) => void) {}

  line(l: string): string | undefined {
    if (!l.trim()) return undefined;
    let ev: {
      message?: { content?: string; tool_calls?: OpenAIToolCallWire[] };
      error?: string;
      done?: boolean;
      prompt_eval_count?: number;
      eval_count?: number;
    };
    try {
      ev = JSON.parse(l) as typeof ev;
    } catch {
      return undefined;
    }
    if (ev.error) throw new ProviderError(200, ev.error);
    if (ev.done && ev.prompt_eval_count !== undefined) this.usage = { prompt: ev.prompt_eval_count, completion: ev.eval_count ?? 0 };
    for (const c of ev.message?.tool_calls ?? []) {
      const call: ToolCall = { id: c.id || newId(), name: c.function?.name ?? '', ...argsOf(c.function?.arguments) };
      this.calls.push(call);
      this.onCall?.(call);
    }
    if (ev.message?.content) {
      this.text += ev.message.content;
      return stripThinking(this.text);
    }
    return undefined;
  }

  reply(): ChatReply {
    return { content: stripThinking(this.text), toolCalls: this.calls, ...(this.usage ? { usage: this.usage } : {}) };
  }
}

/** Reads a streamed body line by line. */
async function eachLine(body: ReadableStream<Uint8Array>, fn: (line: string) => void): Promise<void> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      fn(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
    }
  }
  buf += dec.decode();
  if (buf) fn(buf);
}

// ---- calls ---------------------------------------------------------------------------------------

/** One turn of the chat: the model's words and tool calls. Streams when the server does. */
export async function chat(s: AiSettings, req: ChatRequest, f: Fetch = fetch): Promise<ChatReply> {
  const ollama = s.provider === 'ollama';
  const body = ollama ? ollamaBody(s.model, req.messages, req.tools, true, s.contextTokens, req.think) : openaiBody(s.model, req.messages, req.tools, true);
  const res = await f(chatUrl(s), { method: 'POST', headers: headers(s), body: JSON.stringify(body), signal: req.signal });
  if (!res.ok) throw new ProviderError(res.status, await res.text().catch(() => ''));
  const type = res.headers.get('content-type') ?? '';
  // a server that answered whole, though asked to stream
  if (!res.body || type.includes('application/json')) {
    const v: unknown = await res.json();
    const r = ollama ? parseOllamaReply(v) : parseOpenAIReply(v);
    if (r.content) req.onText?.(r.content);
    for (const c of r.toolCalls) req.onToolCall?.(c);
    return r;
  }
  const stream = ollama ? new OllamaStream(req.onToolCall) : new OpenAIStream(req.onToolCall);
  await eachLine(res.body, (l) => {
    const t = stream.line(l);
    if (t !== undefined) req.onText?.(t);
  });
  return stream.reply();
}

/** The models the server has, by name. */
export async function listModels(s: AiSettings, f: Fetch = fetch, signal?: AbortSignal): Promise<string[]> {
  const res = await f(modelsUrl(s), { headers: headers(s, false), signal });
  if (!res.ok) throw new ProviderError(res.status, await res.text().catch(() => ''));
  const v = (await res.json()) as { models?: { name?: string; model?: string }[]; data?: { id?: string }[] };
  const names = s.provider === 'ollama' ? (v.models ?? []).map((m) => m.name ?? m.model ?? '') : (v.data ?? []).map((m) => m.id ?? '');
  return names.filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export interface ModelInfo {
  /** "tools", "vision", "thinking"… (undefined: the server didn't say). */
  capabilities?: string[];
  /** The longest context the model was made for. */
  contextLength?: number;
}

/** What /api/show says of an Ollama model: its capabilities and its context length. */
export async function ollamaModelInfo(s: AiSettings, f: Fetch = fetch, signal?: AbortSignal): Promise<ModelInfo> {
  const res = await f(`${ollamaRoot(s.baseUrl)}/api/show`, { method: 'POST', headers: headers(s), body: JSON.stringify({ model: s.model }), signal });
  if (!res.ok) throw new ProviderError(res.status, await res.text().catch(() => ''));
  const v = (await res.json()) as { capabilities?: unknown; model_info?: Record<string, unknown> };
  const ctx = Object.entries(v.model_info ?? {}).find(([k, x]) => k.endsWith('.context_length') && typeof x === 'number')?.[1] as number | undefined;
  return {
    ...(Array.isArray(v.capabilities) ? { capabilities: v.capabilities.filter((c): c is string => typeof c === 'string') } : {}),
    ...(ctx ? { contextLength: ctx } : {}),
  };
}

/** A guess at whether an OpenAI-compatible model takes pictures, from its name. */
export function looksLikeVision(model: string): boolean {
  return /gpt-4o|gpt-4\.1|gpt-5|^o[134]|vision|-vl|vl-|llava|gemma-?3|pixtral|qwen2\.5vl|minicpm-v|llama3\.2-vision|moondream/i.test(model);
}
