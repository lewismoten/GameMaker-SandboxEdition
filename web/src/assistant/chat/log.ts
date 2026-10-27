// The chat's conversation as the person sees it: their messages; the model's words in their own
// bubbles (a new bubble after each tool line, each with Copy, even while it streams); each tool
// call as one line ("✎ set_map Laundromat") that shows queued, running and done, opens to its
// arguments and result, and sums up a play-test or Level check; pictures as thumbnails that
// enlarge; Apply/Skip on a change waiting for a yes; notes; and the whole of it as Markdown.
import { h, clear } from '../../editor/core/ui';
import type { Game } from '../../formats/game';
import { normalize } from '../../project/files';
import type { ToolResult } from '../tools/types';
import { resultText } from './agent';
import type { Problem } from './diagnose';
import type { ToolCall } from './providers';

const CHECKS = new Set(['bot_playtest', 'level_check', 'validate', 'record_walkthrough']);
const PICTURES = new Set(['render_png', 'editor_screenshot', 'map_sketch']);

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
  if (typeof a.group === 'string') return a.group;
  if (typeof a.query === 'string') return `“${a.query.slice(0, 30)}”`;
  if (typeof a.name === 'string') return a.name.slice(0, 30);
  return '';
}

/** "✎ set_map Level 2": an icon for the kind of call, its name and what it works on. */
export function callLabel(c: ToolCall, writes: boolean, game?: Game): { icon: string; text: string } {
  const icon = writes ? '✎' : CHECKS.has(c.name) ? '▶' : PICTURES.has(c.name) ? '◫' : '⌕';
  const t = target(c, game);
  return { icon, text: `${c.name}${t ? ` ${t}` : ''}` };
}

/** A play-test's or Level check's result in a few words, for its line. */
export function resultSummary(name: string, words: string): string | undefined {
  try {
    const v = JSON.parse(words) as {
      won?: boolean;
      stopped?: string;
      scenes?: { seconds?: number }[];
      errors?: number;
      warnings?: number;
      ok?: boolean;
      issues?: unknown[];
    };
    if (name === 'bot_playtest' || name === 'record_walkthrough') {
      const secs = (v.scenes ?? []).reduce((n, s) => n + (s.seconds ?? 0), 0);
      return v.won ? `won${secs ? ` in ${Math.round(secs * 10) / 10} s` : ''}` : `couldn’t win${v.stopped ? `: ${v.stopped.slice(0, 60)}` : ''}`;
    }
    if (name === 'level_check') return `${v.errors ?? 0} error${v.errors === 1 ? '' : 's'}, ${v.warnings ?? 0} warning${v.warnings === 1 ? '' : 's'}`;
    if (name === 'validate') return `${v.issues?.length ?? 0} issue${v.issues?.length === 1 ? '' : 's'}`;
  } catch {
    if (name === 'validate' && /No problems/.test(words)) return 'no problems';
  }
  return undefined;
}

interface CallEntry {
  li: HTMLElement;
  state: HTMLElement;
  body: HTMLElement;
  call: ToolCall;
  result?: string;
  pictures: number;
}

export class ChatLog {
  private readonly list = h('ol', { class: 'chat-list' });
  readonly el = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversation' }, this.list);
  private streaming?: HTMLElement;
  private working?: HTMLElement;
  /** Where the current bubble's words start in the reply (after the last tool line). */
  private from = 0;
  private soFar = '';
  /** Where the focus goes after Apply or Skip (the message box). */
  afterAsk?: () => void;
  /** Copies words, and says so. */
  copy?: (text: string) => void;
  private calls = new Map<string, CallEntry>();

  /** Whether the person has scrolled up to read (say, an opened call), so new words don't pull them down. */
  private reading = false;

  constructor() {
    this.el.addEventListener('scroll', () => {
      this.reading = this.el.scrollHeight - this.el.scrollTop - this.el.clientHeight > 40;
    });
  }

  /**
   * Scrolls the conversation (only it: scrollIntoView would scroll the fixed panel too) to its end,
   * unless the person has scrolled up; `force` (their own message) goes there anyway.
   */
  toEnd(force = false): void {
    if (this.reading && !force) return;
    this.el.scrollTop = this.el.scrollHeight;
    this.reading = false;
  }

  clear(): void {
    clear(this.list);
    this.calls.clear();
    this.reading = false;
    this.streaming = this.working = undefined;
    this.from = 0;
    this.soFar = '';
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
    this.reading = false;
    this.add(h('li', { class: 'msg user', dataset: { md: `**You:** ${text}` } }, h('span', { class: 'sr-only' }, 'You: '), h('p', null, text)));
  }

  private bubble(): HTMLElement {
    const p = h('p');
    const li = h(
      'li',
      { class: 'msg bot' },
      h('span', { class: 'sr-only' }, 'Assistant: '),
      p,
      h(
        'button',
        { type: 'button', class: 'msg-copy', 'aria-label': 'Copy this reply', title: 'Copy this reply', onclick: () => this.copy?.(p.textContent ?? '') },
        h('span', { 'aria-hidden': 'true' }, '⧉'),
      ),
    );
    return this.add(li);
  }

  /** The reply's words so far (the whole reply; the current bubble shows those after the last tool line). */
  text(soFar: string): void {
    this.soFar = soFar;
    const t = soFar.slice(this.from).trim();
    if (!t) return;
    this.stopWorking();
    this.streaming ??= this.bubble();
    this.streaming.querySelector('p')!.textContent = t;
    this.streaming.dataset.md = `**Assistant:** ${t}`;
    this.toEnd();
  }

  /** The reply ended: its last words stay, and the next reply starts afresh. */
  reply(content: string): void {
    this.text(content);
    this.streaming = undefined;
    this.from = 0;
    this.soFar = '';
  }

  note(t: string, kind: 'info' | 'error' = 'info'): HTMLElement {
    this.stopWorking();
    return this.add(h('li', { class: `msg note ${kind}`, dataset: { md: `_${t}_` } }, h('p', null, t)));
  }

  problem(p: Problem): void {
    this.stopWorking();
    this.add(
      h(
        'li',
        { class: 'msg note error', dataset: { md: `_${p.title}_ ${p.fix.join(' ')}` } },
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

  /** A tool call, as one line that opens to its arguments; the reply's next words go in a new bubble. */
  call(c: ToolCall, writes: boolean, game?: Game): void {
    this.stopWorking();
    this.streaming = undefined;
    this.from = this.soFar.length;
    const { icon, text } = callLabel(c, writes, game);
    const state = h('span', { class: 'call-state' }, 'queued');
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
    this.calls.set(c.id, { li, state, body, call: c, pictures: 0 });
  }

  running(c: ToolCall): void {
    const at = this.calls.get(c.id);
    if (at) at.state.textContent = 'running…';
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
      // a change waiting for a yes is shown even to someone scrolled up
      this.toEnd(true);
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
    const words = resultText(r);
    at.result = words;
    at.state.textContent = skipped
      ? 'skipped'
      : r.isError
        ? 'failed'
        : words.startsWith('Stopped by the person')
          ? 'stopped'
          : (resultSummary(c.name, words) ?? 'done');
    at.body.append(h('p', { class: 'call-h' }, 'Result'), h('pre', { tabindex: 0 }, words.length > 4000 ? `${words.slice(0, 4000)}…` : words || '(nothing)'));
    // pictures show under the line, small, and open large
    for (const img of r.content)
      if (img.type === 'image') {
        at.pictures++;
        const src = `data:${img.mimeType};base64,${img.data}`;
        const alt = words.split('\n').pop() || 'A picture from the tool';
        at.li.append(
          h(
            'button',
            { type: 'button', class: 'call-thumb', 'aria-label': `Enlarge: ${alt}`, title: 'Enlarge', onclick: () => enlarge(src, alt) },
            h('img', { src, alt: '' }),
          ),
        );
      }
    this.toEnd();
  }

  /** The conversation as Markdown: messages, replies, and tool lines with their arguments and results in short (pictures as [picture]). */
  markdown(): string {
    return [...this.list.children]
      .map((li) => {
        const el = li as HTMLElement;
        if (el.classList.contains('working')) return '';
        if (el.classList.contains('call')) {
          const e = [...this.calls.values()].find((x) => x.li === el);
          if (!e) return '';
          const state = e.state.textContent ?? '';
          const res = e.result ? ` → ${e.result.replace(/\s+/g, ' ').slice(0, 200)}${e.result.length > 200 ? '…' : ''}` : '';
          return `- \`${e.call.name}\` ${JSON.stringify(e.call.args).slice(0, 200)} (${state})${res}${e.pictures ? ' [picture]' : ''}`;
        }
        return el.dataset.md ?? el.textContent ?? '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
}

/** A picture at its full size (pixels kept square), in a dialog. */
function enlarge(src: string, alt: string): void {
  const dlg = h(
    'dialog',
    { class: 'modal chat-picture', 'aria-label': alt },
    h(
      'header',
      { class: 'modal-head' },
      h('h2', null, alt),
      h('button', { class: 'modal-close', 'aria-label': 'Close', title: 'Close (Esc)', onclick: () => (dlg.close(), dlg.remove()) }, '×'),
    ),
    h('img', { src, alt }),
  );
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}
