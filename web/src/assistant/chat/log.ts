// The chat's conversation as the person sees it: their messages, the model's (streaming in),
// each tool call as one compact line ("✎ set_map Level 2") that opens to its arguments and
// result, Apply/Skip on a change waiting for a yes, a working indicator, and problems in words.
import { h, clear } from '../../editor/core/ui';
import type { Game } from '../../formats/game';
import { normalize } from '../../project/files';
import type { ToolResult } from '../tools/types';
import { resultText } from './agent';
import type { Problem } from './diagnose';
import type { ToolCall } from './providers';

const CHECKS = new Set(['bot_playtest', 'level_check', 'validate', 'record_walkthrough']);
const PICTURES = new Set(['render_png', 'editor_screenshot']);

/** Words for what a call works on: a scene's name, the level a map belongs to, or the file. */
function target(c: ToolCall, game?: Game): string {
  const a = c.args;
  const scene = (n: number) => game?.scenes[n]?.desc.trim() || `scene ${n}`;
  if (typeof a.scene === 'number') return scene(a.scene);
  if (typeof a.file === 'string') {
    const f = normalize(a.file);
    const at = game?.scenes.findIndex((s) => s.files[1] && normalize(s.files[1]) === f) ?? -1;
    return f.endsWith('.map') && at >= 0 ? scene(at) : f;
  }
  if (typeof a.what === 'string') return a.what;
  if (typeof a.name === 'string') return a.name.slice(0, 30);
  return '';
}

/** "✎ set_map Level 2": an icon for the kind of call, its name and what it works on. */
export function callLabel(c: ToolCall, writes: boolean, game?: Game): { icon: string; text: string } {
  const icon = writes ? '✎' : CHECKS.has(c.name) ? '▶' : PICTURES.has(c.name) ? '◫' : '⌕';
  const t = target(c, game);
  return { icon, text: `${c.name}${t ? ` ${t}` : ''}` };
}

export class ChatLog {
  private readonly list = h('ol', { class: 'chat-list' });
  readonly el = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversation' }, this.list);
  private streaming?: HTMLElement;
  private working?: HTMLElement;
  /** Where the focus goes after Apply or Skip (the message box). */
  afterAsk?: () => void;
  private calls = new Map<string, { li: HTMLElement; state: HTMLElement; body: HTMLElement }>();

  /** Scrolls the conversation (only it: scrollIntoView would scroll the fixed panel too) to its end. */
  toEnd(): void {
    this.el.scrollTop = this.el.scrollHeight;
  }

  clear(): void {
    clear(this.list);
    this.calls.clear();
    this.streaming = this.working = undefined;
  }

  get empty(): boolean {
    return !this.list.children.length;
  }

  private add(li: HTMLElement): HTMLElement {
    this.list.append(li);
    this.toEnd();
    return li;
  }

  user(text: string): void {
    this.add(h('li', { class: 'msg user' }, h('span', { class: 'sr-only' }, 'You: '), h('p', null, text)));
  }

  /** The model's words so far (one bubble, filled as they stream). */
  text(t: string): void {
    this.stopWorking();
    if (!this.streaming) this.streaming = this.add(h('li', { class: 'msg bot' }, h('span', { class: 'sr-only' }, 'Assistant: '), h('p')));
    this.streaming.querySelector('p')!.textContent = t;
    this.toEnd();
  }

  /** The model's turn ended: its words (when they didn't stream) stay, and the next ones start a new bubble. */
  reply(content: string): void {
    if (content.trim() && !this.streaming) this.text(content);
    else if (this.streaming && content.trim()) this.streaming.querySelector('p')!.textContent = content;
    else if (this.streaming && !content.trim()) this.streaming.remove();
    this.streaming = undefined;
  }

  note(t: string, kind: 'info' | 'error' = 'info'): HTMLElement {
    this.stopWorking();
    return this.add(h('li', { class: `msg note ${kind}` }, h('p', null, t)));
  }

  problem(p: Problem): void {
    this.stopWorking();
    this.add(
      h(
        'li',
        { class: 'msg note error' },
        h('p', null, h('strong', null, p.title)),
        p.fix.length ? h('ul', null, ...p.fix.map((f) => h('li', null, f))) : null,
      ),
    );
  }

  /** The working indicator, until words or a call arrive. */
  startWorking(what = 'Working'): void {
    this.stopWorking();
    this.working = this.add(h('li', { class: 'msg working' }, h('span', { class: 'chat-dots', 'aria-hidden': 'true' }), `${what}…`));
  }

  stopWorking(): void {
    this.working?.remove();
    this.working = undefined;
  }

  /** A tool call, as one line that opens to its arguments. */
  call(c: ToolCall, writes: boolean, game?: Game): void {
    this.stopWorking();
    this.streaming = undefined;
    const { icon, text } = callLabel(c, writes, game);
    const state = h('span', { class: 'call-state' }, '…');
    const body = h('div', { class: 'call-body' }, h('p', { class: 'call-h' }, 'Arguments'), h('pre', { tabindex: 0 }, JSON.stringify(c.args, null, 1)));
    const li = this.add(
      h(
        'li',
        { class: `call${writes ? ' writes' : ''}` },
        h(
          'details',
          null,
          h('summary', null, h('span', { class: 'call-icon', 'aria-hidden': 'true' }, icon), ' ', h('span', { class: 'call-name' }, text), ' ', state),
          body,
        ),
      ),
    );
    this.calls.set(c.id, { li, state, body });
  }

  /** Apply and Skip on a change; resolves true for Apply. Focus goes to Apply when it was in the chat. */
  ask(c: ToolCall, signal?: AbortSignal): Promise<boolean> {
    const at = this.calls.get(c.id);
    if (!at) return Promise.resolve(false);
    return new Promise((resolve) => {
      const done = (v: boolean) => {
        const focused = box.contains(document.activeElement);
        box.remove();
        if (focused) this.afterAsk?.();
        signal?.removeEventListener('abort', stop);
        resolve(v);
      };
      const stop = () => done(false);
      const apply = h('button', { type: 'button', class: 'primary', onclick: () => done(true) }, 'Apply');
      const box = h(
        'div',
        { class: 'call-ask', role: 'group', 'aria-label': `Change: ${at.li.querySelector('.call-name')?.textContent ?? c.name}` },
        h('span', null, 'Make this change?'),
        apply,
        h('button', { type: 'button', onclick: () => done(false) }, 'Skip'),
      );
      at.state.textContent = 'waiting for you';
      at.li.append(box);
      signal?.addEventListener('abort', stop);
      this.toEnd();
      if (this.el.closest('.chat-panel')?.contains(document.activeElement)) apply.focus();
    });
  }

  /** An applied change's own Undo, beside its line (the toast's goes after a while). */
  undoable(c: ToolCall, undo: () => void): void {
    const at = this.calls.get(c.id);
    if (!at) return;
    const btn = h(
      'button',
      {
        type: 'button',
        class: 'call-undo',
        title: 'Takes back this change, and any the assistant made after it',
        'aria-label': `Undo ${at.li.querySelector('.call-name')?.textContent ?? c.name}`,
        onclick: () => {
          undo();
          btn.remove();
          at.state.textContent = 'undone';
          at.li.classList.add('skipped');
        },
      },
      'Undo',
    );
    at.li.append(btn);
  }

  result(c: ToolCall, r: ToolResult, skipped?: boolean): void {
    const at = this.calls.get(c.id);
    if (!at) return;
    at.li.classList.toggle('failed', !!r.isError);
    at.li.classList.toggle('skipped', !!skipped);
    at.state.textContent = skipped ? 'skipped' : r.isError ? 'failed' : 'done';
    const words = resultText(r);
    at.body.append(h('p', { class: 'call-h' }, 'Result'), h('pre', { tabindex: 0 }, words.length > 4000 ? `${words.slice(0, 4000)}…` : words || '(nothing)'));
    for (const img of r.content)
      if (img.type === 'image')
        at.body.append(
          h('img', { class: 'call-img', src: `data:${img.mimeType};base64,${img.data}`, alt: words.split('\n').pop() || 'A picture from the tool' }),
        );
  }
}
