// The chat's loop, with no DOM. The person's request goes to the model with a few tools (more
// come out by group: toolCategories.ts); each tool call runs as soon as it has fully arrived
// (natively, or written as text: textCalls.ts), one at a time in order, while the reply streams
// on; its result goes back, and so on until the model answers in words, Stop is pressed or the
// step limit is reached. The context is kept within the model's limit: big results are cut
// short, and near the limit older requests are put away for a summary (compact.ts). Everything
// is kept whole in the archive, which recall() searches.
import { toOpenAITools, type OpenAITool } from '../openai';
import type { ToolDef, ToolResult } from '../tools/types';
import { Archive, RECALL_SCHEMA, recallText } from './archive';
import { fixedSummary, requestStarts, splitForCompaction, summaryMessages } from './compact';
import type { ChatMessage, ChatReply, ChatRequest, ToolCall } from './providers';
import { coerceArgs } from './coerce';
import { scanText } from './textCalls';
import { estimateTokens, messagesTokens, toolsTokens, type Gauge } from './tokens';
import { CORE, ToolSet, terse } from './toolCategories';
import { prepareHistory } from './trim';

export interface AgentTool {
  def: Pick<ToolDef, 'name' | 'description' | 'inputSchema' | 'writes'>;
  run(args: Record<string, unknown>): Promise<ToolResult>;
}

export type AgentEvent =
  | { type: 'text'; text: string }
  | { type: 'reply'; content: string; calls: ToolCall[] }
  | { type: 'call'; call: ToolCall; writes: boolean }
  | { type: 'running'; call: ToolCall }
  | { type: 'result'; call: ToolCall; result: ToolResult; skipped?: boolean }
  | { type: 'gauge'; gauge: Gauge }
  | { type: 'compacted'; how: 'model' | 'fixed'; summary: string; putAway: number }
  | { type: 'tools'; loaded: string[] };

export interface AgentOptions {
  chat(req: ChatRequest): Promise<ChatReply>;
  /** Every tool there is (the groups decide which are offered). */
  tools: AgentTool[];
  /** The system message: compact for a small context. */
  system(compact: boolean): string | Promise<string>;
  /** Whether the model sees pictures. */
  images(): boolean;
  /** The context's size in tokens. */
  limit(): number;
  archive?: Archive;
  /** The game's open to-dos, for a summary. */
  todos?(): string[];
  /** Offer every tool at once (a big model), not by group. */
  allTools?(): boolean;
  /** Ollama's think switch for a thinking model. */
  think?(): boolean | undefined;
  maxSteps?: number;
  /** Requests kept word for word by compaction. */
  keepRequests?: number;
}

export interface SendOptions {
  signal?: AbortSignal;
  /** Asked before a change is made; false skips it. Left out: changes go ahead. */
  approve?(call: ToolCall, tool: AgentTool): Promise<boolean>;
  onEvent?: (e: AgentEvent) => void;
}

/** The words of a result, for the model and the chat. */
export function resultText(r: ToolResult): string {
  return r.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .filter(Boolean)
    .join('\n');
}

export const SKIPPED = 'The person skipped this change, so nothing was changed. Don’t make it again unless they ask.';
const STOPPED = 'Stopped by the person before this ran.';
const PICTURE_TOOLS = new Set(['render_png', 'editor_screenshot']);
/** A request that asks to see something. */
export const asksForPicture = (t: string) => /\b(pictures?|screenshots?|images?|render|draw|png|show me|looks? like|see (it|the|what))\b/i.test(t);
/** Changes before another picture may be drawn unasked. */
const EDITS_PER_PICTURE = 3;

let textIds = 0;

export class Agent {
  /** The context's messages after the system one. */
  messages: ChatMessage[] = [];
  /** What compaction put away, in short. */
  summary = '';
  readonly archive: Archive;
  readonly toolset: ToolSet;
  private turn: number;
  private latestRequest = '';
  private editsSincePicture = EDITS_PER_PICTURE;
  private lastPicture = '';
  private own: AgentTool[];

  constructor(private readonly o: AgentOptions) {
    this.archive = o.archive ?? new Archive();
    this.turn = this.archive.lastTurn;
    this.toolset = new ToolSet(o.tools);
    this.own = [
      {
        def: {
          name: 'load_tools',
          description: `Gets a group of tools for your next steps. Groups: ${this.toolset
            .categories()
            .map((c) => `${c.id} (${c.about})`)
            .join(', ')}.`,
          inputSchema: {
            type: 'object',
            properties: {
              group: {
                type: 'string',
                description: `One of: ${this.toolset
                  .categories()
                  .map((c) => c.id)
                  .join(', ')} (or several, with commas).`,
              },
            },
            required: ['group'],
          },
        },
        run: async (a) => {
          // a small model may ask for several at once, or for all of them
          const g = a.group ?? a.groups;
          const asked = (Array.isArray(g) ? g.map((x) => (typeof x === 'string' ? x : '')) : typeof g === 'string' ? g.split(/[\s,;|]+/) : []).filter(Boolean);
          const loaded = asked.flatMap((g) => {
            const got = this.toolset.load(g.toLowerCase());
            return got ? [`${g}: ${got.join(', ')}`] : [];
          });
          const unknown = asked.filter((g) => !this.toolset.categories().some((c) => c.id === g.toLowerCase()));
          if (!loaded.length)
            return text(
              `No group ${asked.join(', ') || '(none given)'}. Groups: ${this.toolset
                .categories()
                .map((c) => c.id)
                .join(', ')}.`,
              true,
            );
          return text(`Loaded ${loaded.join('; ')}.${unknown.length ? ` (No group ${unknown.join(', ')}.)` : ''} Use them from your next step.`);
        },
      },
      {
        def: { name: 'recall', description: 'Reads earlier parts of this chat that were put away: search words, or a turn range.', inputSchema: RECALL_SCHEMA },
        run: async (a) => text(recallText(this.archive, a)),
      },
    ];
  }

  /** A small context: the compact prompts. */
  get small(): boolean {
    return this.o.limit() < 8192;
  }

  private find(name: string): AgentTool | undefined {
    return this.own.find((t) => t.def.name === name) ?? this.toolset.get(name);
  }

  /** The tools offered now: pictures only to a model that sees them. */
  private offered(): OpenAITool[] {
    const sees = this.o.images();
    const defs = [...this.own, ...(this.o.allTools?.() ? this.o.tools : this.toolset.active())]
      .filter((t) => sees || !PICTURE_TOOLS.has(t.def.name))
      .map((t) => terse(t.def));
    // the core first, in its order
    defs.sort((a, b) => rank(a.name) - rank(b.name));
    return toOpenAITools(defs);
  }

  /** What would be sent now, and its size. */
  private async prepare(): Promise<{ messages: ChatMessage[]; tools: OpenAITool[]; tokens: number }> {
    const base = await this.o.system(this.small);
    const system = this.summary ? `${base}\n\nEarlier in this chat (in short; recall reads the rest):\n${this.summary}` : base;
    const messages: ChatMessage[] = [{ role: 'system', content: system }, ...prepareHistory(this.messages)];
    const tools = this.offered();
    return { messages, tools, tokens: messagesTokens(messages) + toolsTokens(tools) };
  }

  /** Room left for the reply. */
  private get reserve(): number {
    return Math.max(256, Math.min(2048, Math.round(this.o.limit() * 0.2)));
  }

  /** Tokens a tool result may take in the context. */
  private get resultBudget(): number {
    return Math.max(200, Math.min(1500, Math.round(this.o.limit() * 0.12)));
  }

  /** The gauge before anything is sent: an estimate. */
  async estimate(): Promise<Gauge> {
    return { used: (await this.prepare()).tokens, limit: this.o.limit(), reported: false };
  }

  /** A fresh context: the conversation stays in the archive. */
  reset(): void {
    this.messages = [];
    this.summary = '';
    this.toolset.reset();
  }

  /** Puts away older requests for a summary; false when there was nothing to put away. */
  async compact(opts: SendOptions & { keep?: number } = {}): Promise<boolean> {
    const { old, kept } = splitForCompaction(this.messages, opts.keep ?? this.o.keepRequests ?? 2);
    if (!old.length) return false;
    const todos = this.o.todos?.() ?? [];
    let summary = '';
    let how: 'model' | 'fixed' = 'fixed';
    // a model with room to read the turns writes it; a small one gets the plain one
    if (this.o.limit() >= 6000)
      try {
        const r = await this.o.chat({ messages: summaryMessages(old, this.summary, todos, this.o.limit() * 2), tools: [], signal: opts.signal, think: false });
        summary = r.content.trim().slice(0, 900);
        how = 'model';
      } catch (e) {
        if (opts.signal?.aborted) throw e;
      }
    if (!summary) summary = fixedSummary(old, this.summary, todos);
    this.summary = summary;
    this.messages = kept;
    this.toolset.reset();
    this.archive.add({ turn: this.turn, role: 'summary', text: summary });
    opts.onEvent?.({ type: 'compacted', how, summary, putAway: old.length });
    opts.onEvent?.({ type: 'tools', loaded: [] });
    return true;
  }

  /** Cuts what must go for the request to fit, when compaction wasn't enough, a step at a time; false when nothing is left to cut. */
  private squeeze(): boolean {
    // 1. long results cut short (the archive has them whole)
    const long = this.messages.filter((m): m is Extract<ChatMessage, { role: 'tool' }> => m.role === 'tool' && m.content.length > 240);
    if (long.length) {
      for (const m of long) m.content = `${m.content.slice(0, 200)}… (cut short to fit; recall has it all)`;
      return true;
    }
    // 2. tool groups the last few calls didn't use put away
    const recent = this.messages.flatMap((m) => (m.role === 'assistant' ? (m.toolCalls ?? []).map((c) => c.name) : [])).slice(-3);
    if (this.toolset.keepOnly(recent)) return true;
    // 3. the latest request's older steps folded into one line of progress
    if (this.foldSteps()) return true;
    // 4. older requests let go
    const { old, kept } = splitForCompaction(this.messages, 1);
    if (!old.length) return false;
    this.messages = kept;
    return true;
  }

  /** Folds all but the last two steps (a reply and its results) of the latest request into one line. */
  private foldSteps(): boolean {
    const start = requestStarts(this.messages).pop() ?? -1;
    const steps: number[] = [];
    this.messages.forEach((m, i) => i > start && m.role === 'assistant' && steps.push(i));
    if (steps.length < 3) return false;
    const end = steps[steps.length - 2];
    const done = this.messages.slice(steps[0], end);
    const line = done
      .flatMap((m) =>
        m.role === 'tool'
          ? [`${m.name} → ${m.content.replace(/\s+/g, ' ').slice(0, 60)}`]
          : m.role === 'assistant' && m.content.trim()
            ? [m.content.trim().slice(0, 80)]
            : [],
      )
      .join('; ');
    this.messages.splice(steps[0], end - steps[0], { role: 'assistant', content: `(Steps so far: ${line})` });
    return true;
  }

  /** Sends a request and works until the model answers in words. Resolves with that answer. */
  async send(text: string, opts: SendOptions = {}): Promise<string> {
    const { signal, onEvent } = opts;
    this.turn++;
    this.latestRequest = text;
    this.toolset.nextRequest();
    onEvent?.({ type: 'tools', loaded: this.toolset.loadedIds });
    this.messages.push({ role: 'user', content: text });
    this.archive.add({ turn: this.turn, role: 'user', text });
    const max = this.o.maxSteps ?? 24;
    for (let step = 0; step < max; step++) {
      signal?.throwIfAborted();
      let req = await this.prepare();
      const budget = this.o.limit() - this.reserve;
      if (req.tokens > budget * 0.9 && (await this.compact(opts))) req = await this.prepare();
      while (req.tokens > budget && this.squeeze()) req = await this.prepare();
      const done = await this.step(req, opts);
      if (!done.calls.length) return done.content;
    }
    const note = `I stopped after ${max} steps. Say “go on” to let me continue.`;
    this.messages.push({ role: 'assistant', content: note });
    onEvent?.({ type: 'reply', content: note, calls: [] });
    return note;
  }

  /** One reply: its tool calls run as they arrive; the reply and their results join the context. */
  private async step(
    req: { messages: ChatMessage[]; tools: OpenAITool[]; tokens: number },
    opts: SendOptions,
  ): Promise<{ content: string; calls: ToolCall[] }> {
    const { signal, onEvent } = opts;
    const names = new Set([...this.own.map((t) => t.def.name), ...this.toolset.names]);
    const calls: ToolCall[] = [];
    const results: ChatMessage[] = [];
    const pictures: string[] = [];
    const seen = new Set<string>();
    let textCalls = 0;
    let shown = '';
    let chain = Promise.resolve();
    const enqueue = (c: ToolCall) => {
      if (!c.name || seen.has(c.id)) return;
      seen.add(c.id);
      calls.push(c);
      onEvent?.({ type: 'call', call: c, writes: !!this.find(c.name)?.def.writes });
      chain = chain.then(() => this.run(c, opts, results, pictures));
    };
    const scan = (raw: string) => {
      const s = scanText(raw, names);
      for (; textCalls < s.calls.length; textCalls++) enqueue({ id: `text_${++textIds}`, name: s.calls[textCalls].name, args: s.calls[textCalls].args });
      shown = s.shown;
    };
    let reply: ChatReply | undefined;
    try {
      reply = await this.o.chat({
        messages: req.messages,
        tools: req.tools,
        signal,
        think: this.o.think?.(),
        onText: (raw) => {
          scan(raw);
          onEvent?.({ type: 'text', text: shown });
        },
        onToolCall: enqueue,
      });
      scan(reply.content);
      for (const c of reply.toolCalls) enqueue(c);
    } finally {
      // the calls already started finish (or are marked stopped), so the context stays whole
      await chain;
      if (calls.length || reply) {
        this.messages.push({ role: 'assistant', content: shown, ...(calls.length ? { toolCalls: calls } : {}) });
        this.messages.push(...results);
        if (pictures.length) this.messages.push({ role: 'user', content: 'The picture from the tool above.', images: pictures });
      }
    }
    if (shown.trim()) this.archive.add({ turn: this.turn, role: 'assistant', text: shown });
    onEvent?.({ type: 'reply', content: shown, calls });
    const used = reply.usage ? reply.usage.prompt + reply.usage.completion : req.tokens + estimateTokens(reply.content);
    onEvent?.({ type: 'gauge', gauge: { used, limit: this.o.limit(), reported: !!reply.usage } });
    signal?.throwIfAborted();
    return { content: shown, calls };
  }

  /** Runs one call and records its result. */
  private async run(c: ToolCall, opts: SendOptions, results: ChatMessage[], pictures: string[]): Promise<void> {
    const { signal, onEvent } = opts;
    const tool = this.find(c.name);
    let result: ToolResult;
    let skipped = false;
    if (signal?.aborted) result = text(STOPPED);
    else if (!tool) result = text(`There is no tool ${c.name}. load_tools lists the groups.`, true);
    else if (c.badArgs !== undefined) result = text(`The arguments for ${c.name} weren’t a JSON object: ${c.badArgs.slice(0, 200)}`, true);
    else {
      // "2" for 2 and the like, so the line, the change's place and the tool all see the meaning
      c.args = coerceArgs(tool.def.inputSchema, c.args);
      onEvent?.({ type: 'running', call: c });
      if (this.toolset.touch(c.name)) onEvent?.({ type: 'tools', loaded: this.toolset.loadedIds });
      const refused = PICTURE_TOOLS.has(c.name) ? this.pictureRefused(c) : undefined;
      if (refused) result = text(refused);
      else if (tool.def.writes && !c.args.dry_run && opts.approve && !(await opts.approve(c, tool))) {
        result = text(signal?.aborted ? STOPPED : SKIPPED);
        skipped = true;
      } else {
        result = await tool.run(c.args);
        if (tool.def.writes && !result.isError && !c.args.dry_run) this.editsSincePicture++;
        if (c.name === 'load_tools') onEvent?.({ type: 'tools', loaded: this.toolset.loadedIds });
      }
    }
    const full = resultText(result) || (result.isError ? 'It failed.' : 'Done.');
    this.archive.add({ turn: this.turn, role: 'tool', name: c.name, text: full });
    let words = full;
    const budget = this.resultBudget * 4;
    if (words.length > budget)
      words = `${words.slice(0, budget)}\n… (cut short: ${words.length - budget} more characters. Call it again with a narrower range, a smaller region or fewer findings, for the rest; recall has it all.)`;
    const imgs = result.content.flatMap((x) => (x.type === 'image' ? [x.data] : []));
    if (imgs.length) {
      if (this.o.images() && asksForPicture(this.latestRequest)) {
        pictures.push(...imgs);
        words += '\n(The picture is in the next message.)';
      } else words += '\n(The picture was shown to the person; it isn’t sent to you.)';
    }
    results.push({ role: 'tool', callId: c.id, name: c.name, content: result.isError ? `Error: ${words}` : words });
    onEvent?.({ type: 'result', call: c, result, skipped });
  }

  /** Keeps pictures for when they help: not the same one twice with nothing changed, and not every step unless asked. */
  private pictureRefused(c: ToolCall): string | undefined {
    const key = `${c.name}:${JSON.stringify(c.args)}`;
    if (key === this.lastPicture && this.editsSincePicture === 0) return 'Same picture as before: nothing has changed since. It is in the chat for the person.';
    if (!asksForPicture(this.latestRequest) && this.editsSincePicture < EDITS_PER_PICTURE)
      return `No picture now: one was drawn ${this.editsSincePicture} change${this.editsSincePicture === 1 ? '' : 's'} ago. Make a few more changes first, or use map_sketch for a quick look.`;
    this.lastPicture = key;
    this.editsSincePicture = 0;
    return undefined;
  }
}

const text = (t: string, isError = false): ToolResult => ({ content: [{ type: 'text', text: t }], ...(isError ? { isError: true } : {}) });
const rank = (name: string) => {
  const i = CORE.indexOf(name);
  return i < 0 ? CORE.length : i;
};
