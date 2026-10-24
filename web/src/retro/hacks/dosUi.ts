// The look of a 1995 shareware DOS utility in 80x25 text mode, shared by SAVEHACK.EXE and
// BACKUP.EXE on the desk PC: white on blue, cyan frames, a black-on-cyan bar for the chosen
// line and the keys at the bottom, red boxes for warnings. Arrow keys, Enter and Esc.
import { attr, COLS, ROWS } from '../text/textScreen';
import type { Ui } from '../text/textUi';
import { toCp437 } from '../text/cp437';

export const BG = attr(15, 1);
export const TEXT = attr(7, 1);
export const BRIGHT = attr(15, 1);
export const HEAD = attr(11, 1);
export const YELLOW = attr(14, 1);
export const GREEN = attr(10, 1);
export const RED = attr(12, 1);
export const DIM = attr(3, 1);
export const FRAME = attr(3, 1);
export const BAR = attr(0, 3);
const BAR_KEY = attr(4, 3);
export const WARN = attr(15, 4);
const SHADOW = attr(8, 0);

/** Text in CP437, cut or padded to `w` columns. */
export const cell = (text: string, w: number): string => toCp437(text).slice(0, w).padEnd(w);

/** Writes plain text (converted to CP437). */
export function put(ui: Ui, x: number, y: number, a: number, text: string): void {
  ui.screen.write(x, y, a, toCp437(text));
}

/** The bottom line: keys in red on cyan ("~Enter~ Edit  ~Esc~ Back"). */
export function keyBar(ui: Ui, text: string): void {
  const s = ui.screen;
  s.fill(0, ROWS - 1, COLS - 1, ROWS - 1, BAR);
  let x = 1;
  let key = false;
  for (const part of text.split('~')) {
    put(ui, x, ROWS - 1, key ? BAR_KEY : BAR, part);
    x += part.length;
    key = !key;
  }
}

/** One line above the key bar for what just happened (or a warning). */
export function statusLine(ui: Ui, text: string, a = TEXT): void {
  ui.screen.fill(0, ROWS - 2, COLS - 1, ROWS - 2, BG);
  put(ui, 1, ROWS - 2, a, text.slice(0, COLS - 2));
}

/** A single-line cyan frame with a title in its top edge; clears the inside. */
export function frame(ui: Ui, x: number, y: number, x1: number, y1: number, title = ''): void {
  const s = ui.screen;
  s.fill(x + 1, y + 1, x1 - 1, y1 - 1, BG);
  s.box(x, y, x1, y1, FRAME, 1);
  if (title) put(ui, x + 2, y, HEAD, ` ${title} `);
}

export interface ListRow {
  text: string;
  /** Header and spacer rows are skipped by the cursor. */
  selectable?: boolean;
  a?: number;
}

interface ListOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  cur?: number;
  /** Keys (upper case letters, F-keys, Delete…) that end the list besides Enter and Esc. */
  hotkeys?: string[];
  /** Called as the cursor moves (to show details of the chosen row). */
  onMove?: (i: number) => void;
}

/** A scrolling list; returns the row chosen and the key that chose it ('Enter', 'Escape' or a hotkey). */
export async function pickList(ui: Ui, rows: ListRow[], o: ListOptions): Promise<{ i: number; key: string }> {
  const s = ui.screen;
  const ok = (i: number) => rows[i] && rows[i].selectable !== false;
  let cur = Math.max(0, Math.min(rows.length - 1, o.cur ?? 0));
  if (!ok(cur)) cur = rows.findIndex((_, i) => ok(i));
  let top = 0;
  const step = (from: number, d: number) => {
    for (let i = from + d; i >= 0 && i < rows.length; i += d) if (ok(i)) return i;
    return from;
  };
  for (;;) {
    if (cur < top) top = cur;
    if (cur >= top + o.h) top = cur - o.h + 1;
    // a header just above the first row shown comes into view with it
    if (top > 0 && cur === top && !ok(top - 1) && top - 1 < cur) top = Math.max(0, top - 1);
    for (let r = 0; r < o.h; r++) {
      const i = top + r;
      const row = rows[i];
      const a = i === cur ? BAR : (row?.a ?? BRIGHT);
      s.write(o.x, o.y + r, a, cell(row ? ` ${row.text}` : '', o.w));
    }
    // a scroll mark on the right when there is more
    if (rows.length > o.h) {
      s.put(o.x + o.w, o.y, top > 0 ? 30 : 32, FRAME);
      s.put(o.x + o.w, o.y + o.h - 1, top + o.h < rows.length ? 31 : 32, FRAME);
    }
    o.onMove?.(cur);
    const k = await ui.keys.next();
    const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
    if (key === 'ArrowDown') cur = step(cur, 1);
    else if (key === 'ArrowUp') cur = step(cur, -1);
    else if (key === 'PageDown') for (let n = 0; n < o.h - 1; n++) cur = step(cur, 1);
    else if (key === 'PageUp') for (let n = 0; n < o.h - 1; n++) cur = step(cur, -1);
    else if (key === 'Home') cur = step(-1, 1);
    else if (key === 'End') cur = step(rows.length, -1);
    else if (key === 'Enter' || key === 'Escape' || o.hotkeys?.includes(key)) return { i: cur, key };
  }
}

/** Reads a line in place; `allow` filters the characters. Null for Esc. */
export async function editLine(
  ui: Ui,
  x: number,
  y: number,
  w: number,
  start: string,
  allow: RegExp = /^[\x20-\x7e]$/,
  a = attr(15, 0),
): Promise<string | null> {
  const s = ui.screen;
  let text = start;
  let fresh = true; // typing first replaces what was there, as DOS editors did
  s.cursorVisible = true;
  try {
    for (;;) {
      s.write(x, y, fresh && text ? attr(0, 7) : a, cell(text, w));
      s.cursorX = Math.min(x + w - 1, x + text.length);
      s.cursorY = y;
      const k = await ui.keys.next();
      if (k.key === 'Escape') return null;
      if (k.key === 'Enter') return text;
      if (k.key === 'Backspace') text = fresh ? '' : text.slice(0, -1);
      else if (k.key.length === 1 && allow.test(k.key)) {
        if (fresh) text = '';
        if (text.length < w - 1) text += k.key;
      } else if (k.key !== 'ArrowLeft' && k.key !== 'ArrowRight' && k.key !== 'End') continue;
      fresh = false;
    }
  } finally {
    s.cursorVisible = false;
  }
}

/** A box of lines in the middle of the screen; returns the key pressed (upper case). */
export async function messageBox(ui: Ui, lines: string[], a = WARN, keys?: string[]): Promise<string> {
  const s = ui.screen;
  const w = Math.min(74, Math.max(...lines.map((l) => l.length)) + 4);
  const x = Math.floor((COLS - w) / 2);
  const y = Math.max(2, Math.floor((ROWS - lines.length - 2) / 2));
  const saved = s.save(x, y, w + 2, lines.length + 3);
  s.fill(x, y, x + w - 1, y + lines.length + 1, a);
  s.box(x, y, x + w - 1, y + lines.length + 1, a, 2, SHADOW);
  lines.forEach((l, i) => put(ui, x + 2, y + 1 + i, a, l.slice(0, w - 4)));
  try {
    for (;;) {
      const k = await ui.keys.next();
      const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
      if (!keys || keys.includes(key)) return key;
    }
  } finally {
    s.restore(saved);
  }
}

/** A Y/N question; Enter is yes, Esc no. */
export async function confirm(ui: Ui, lines: string[], a = WARN): Promise<boolean> {
  const k = await messageBox(ui, [...lines, '', 'Are you sure (Y/N)?'], a, ['Y', 'N', 'Enter', 'Escape']);
  return k === 'Y' || k === 'Enter';
}

/** 1234567 → "1,234,567". */
export const num = (n: number): string => n.toLocaleString('en-US');

/** A date as a 1995 DOS program printed it: 10-22-95  3:04p. */
export function dosStamp(d: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  const h = d.getHours() % 12 || 12;
  return `${two(d.getMonth() + 1)}-${two(d.getDate())}-${two(d.getFullYear() % 100)} ${String(h).padStart(2)}:${two(d.getMinutes())}${d.getHours() >= 12 ? 'p' : 'a'}`;
}
