// The chat's loop, with no DOM: the person's message goes to the model with the tools; each
// tool call it makes is run (a change first asked about, in "Ask before changing"), its result
// goes back, and so on until the model answers in words, Stop is pressed or the step limit is
// reached. Pictures from a tool go back as a following message when the model takes pictures.
import { toOpenAITools } from '../openai';
import type { ToolDef, ToolResult } from '../tools/types';
import { toolCallInText, type ChatMessage, type ChatReply, type ChatRequest, type ToolCall } from './providers';
import { trimHistory } from './trim';

export interface AgentTool {
  def: Pick<ToolDef, 'name' | 'description' | 'inputSchema' | 'writes'>;
  run(args: Record<string, unknown>): Promise<ToolResult>;
}

export type AgentEvent =
  | { type: 'text'; text: string }
  | { type: 'reply'; content: string; calls: ToolCall[] }
  | { type: 'call'; call: ToolCall; writes: boolean }
  | { type: 'result'; call: ToolCall; result: ToolResult; skipped?: boolean };

export interface AgentOptions {
  chat(req: ChatRequest): Promise<ChatReply>;
  tools: AgentTool[];
  /** The system message, made afresh each turn (the game changes). */
  system(): string | Promise<string>;
  /** Whether pictures are sent to the model. */
  images(): boolean;
  /** About how many characters of history fit. */
  budget(): number;
  maxSteps?: number;
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

export class Agent {
  readonly messages: ChatMessage[] = [{ role: 'system', content: '' }];
  private readonly byName: Map<string, AgentTool>;

  constructor(private readonly o: AgentOptions) {
    this.byName = new Map(o.tools.map((t) => [t.def.name, t]));
  }

  /** Forgets the conversation. */
  reset(): void {
    this.messages.length = 1;
  }

  /** Sends a message and works until the model answers in words. Resolves with that answer. */
  async send(text: string, opts: SendOptions = {}): Promise<string> {
    const { signal, onEvent } = opts;
    this.messages.push({ role: 'user', content: text });
    const tools = toOpenAITools(this.o.tools.map((t) => t.def));
    const names = new Set(this.byName.keys());
    const max = this.o.maxSteps ?? 24;
    for (let step = 0; step < max; step++) {
      signal?.throwIfAborted();
      this.messages[0] = { role: 'system', content: await this.o.system() };
      const reply = await this.o.chat({
        messages: trimHistory(this.messages, this.o.budget()),
        tools,
        signal,
        onText: (t) => onEvent?.({ type: 'text', text: t }),
      });
      let calls = reply.toolCalls.filter((c) => c.name);
      let content = reply.content;
      if (!calls.length) {
        const inText = toolCallInText(content, names);
        if (inText) ((calls = [inText]), (content = ''));
      }
      this.messages.push({ role: 'assistant', content, ...(calls.length ? { toolCalls: calls } : {}) });
      onEvent?.({ type: 'reply', content, calls });
      if (!calls.length) return content;
      const pictures: string[] = [];
      for (const call of calls) {
        if (signal?.aborted) {
          this.messages.push({ role: 'tool', callId: call.id, name: call.name, content: STOPPED });
          continue;
        }
        const tool = this.byName.get(call.name);
        onEvent?.({ type: 'call', call, writes: !!tool?.def.writes });
        let result: ToolResult;
        let skipped = false;
        if (!tool) result = { content: [{ type: 'text', text: `There is no tool ${call.name}. The tools are: ${[...names].join(', ')}.` }], isError: true };
        else if (call.badArgs !== undefined)
          result = { content: [{ type: 'text', text: `The arguments for ${call.name} weren’t a JSON object: ${call.badArgs.slice(0, 200)}` }], isError: true };
        else if (tool.def.writes && !call.args.dry_run && opts.approve && !(await opts.approve(call, tool))) {
          result = { content: [{ type: 'text', text: signal?.aborted ? STOPPED : SKIPPED }] };
          skipped = true;
        } else result = await tool.run(call.args);
        let words = resultText(result) || (result.isError ? 'It failed.' : 'Done.');
        const imgs = result.content.flatMap((c) => (c.type === 'image' ? [c.data] : []));
        if (imgs.length) {
          if (this.o.images()) {
            pictures.push(...imgs);
            words += '\n(The picture is in the next message.)';
          } else words += '\n(A picture was made, but this model can’t see pictures: use get_map or list_blocks instead.)';
        }
        this.messages.push({ role: 'tool', callId: call.id, name: call.name, content: result.isError ? `Error: ${words}` : words });
        onEvent?.({ type: 'result', call, result, skipped });
      }
      if (pictures.length) this.messages.push({ role: 'user', content: 'The picture from the tool above.', images: pictures });
      signal?.throwIfAborted();
    }
    const note = `I stopped after ${max} steps. Say “go on” to let me continue.`;
    this.messages.push({ role: 'assistant', content: note });
    onEvent?.({ type: 'reply', content: note, calls: [] });
    return note;
  }
}
