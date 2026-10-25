// Game-Maker's text-mode user interface (code/GM/WINDIO.C, MENUC.C): menu bars,
// vertical menus, error boxes, the file picker and .HLP help screens.
import { attr, type TextScreen } from './textScreen';
import type { TextKeys } from './textInput';
import { toCp437 } from './cp437';

export const MENUATTR = attr(14, 1); // yellow on navy
export const SHADATTR = attr(0, 7); // shadow: dark grey background
export const ERRORATTR = attr(12, 4); // bright red on red
export const BARCURSOR = attr(15, 7); // MENUC.C cursor: white on dark grey
export const CURATTR = 47; // WINDIO.C cursor (PGMTITLECOL): white on blue
export const TITLEATTR = attr(15, 4);
export const BARATTR = attr(15, 1);

export interface Ui {
  screen: TextScreen;
  keys: TextKeys;
}

/** horizmenu: items start at the given x positions on row y. Returns 1..n, or 0 for Esc. */
export async function horizMenu(ui: Ui, y: number, xs: number[], current: number): Promise<number> {
  const n = xs.length - 1;
  let cur = Math.max(0, Math.min(n - 1, current - 1));
  const saved = ui.screen.save(0, y, 80, 1);
  const show = () => {
    ui.screen.restore(saved);
    ui.screen.paint(xs[cur], y, xs[cur + 1] - 1, y, BARCURSOR);
  };
  for (;;) {
    show();
    const k = await ui.keys.next();
    if (k.key === 'ArrowRight') cur = (cur + 1) % n;
    else if (k.key === 'ArrowLeft') cur = (cur + n - 1) % n;
    else if (k.key === 'Enter' || k.key === 'ArrowDown') {
      ui.screen.restore(saved);
      return cur + 1;
    } else if (k.key === 'Escape' || k.key === 'ArrowUp') {
      ui.screen.restore(saved);
      return 0;
    } else if (k.key.length === 1) {
      // First letter jumps to an item, as in most DOS menus.
      const row = String.fromCharCode(...ui.screen.chars.subarray(y * 80, y * 80 + 80));
      const idx = xs.slice(0, n).findIndex((x, i) =>
        row
          .slice(x, xs[i + 1])
          .trim()
          .toUpperCase()
          .startsWith(k.key.toUpperCase()),
      );
      if (idx >= 0) {
        cur = idx;
        show();
        ui.screen.restore(saved);
        return cur + 1;
      }
    }
  }
}

/** vertmenu: rows y..y+n-1 starting at column x, `len` wide. Returns 1..n or 0. */
export async function vertMenu(ui: Ui, x: number, y: number, len: number, n: number, current = 1): Promise<number> {
  let cur = Math.max(0, Math.min(n - 1, current - 1));
  const saved = ui.screen.save(x, y, len, n);
  for (;;) {
    ui.screen.restore(saved);
    ui.screen.paint(x, y + cur, x + len - 1, y + cur, CURATTR);
    const k = await ui.keys.next();
    if (k.key === 'ArrowDown') cur = (cur + 1) % n;
    else if (k.key === 'ArrowUp') cur = (cur + n - 1) % n;
    else if (k.key === 'Enter') {
      ui.screen.restore(saved);
      return cur + 1;
    } else if (k.key === 'Escape') {
      ui.screen.restore(saved);
      return 0;
    }
  }
}

/** errorbox: two lines in a red box; returns the key pressed (upper case). */
export async function errorBox(ui: Ui, l1: string, l2: string): Promise<string> {
  const len = Math.max(l1.length, l2.length);
  const x = 40 - Math.floor(len / 2) - 1;
  const y = 8;
  const x1 = x + len + 2;
  const saved = ui.screen.save(x - 1, y - 1, len + 7, 5);
  ui.screen.box(x - 1, y - 1, x1 + 1, y + 2, ERRORATTR, 2, SHADATTR);
  ui.screen.fill(x, y, x1, y + 1, ERRORATTR);
  ui.screen.write(x + 1, y, ERRORATTR, toCp437(l1));
  ui.screen.write(x + 1, y + 1, ERRORATTR, toCp437(l2));
  const k = await ui.keys.next();
  ui.screen.restore(saved);
  return k.key.length === 1 ? k.key.toUpperCase() : k.key;
}

/** DisplayHelpFile: .HLP files are raw 80x25 text screens (character, attribute pairs). */
export async function showHelpScreen(ui: Ui, bytes: Uint8Array): Promise<void> {
  const before = ui.screen.snapshot();
  const pages = Math.max(1, Math.floor(bytes.length / 4000));
  for (let p = 0; p < pages; p++) {
    for (let i = 0; i < 2000; i++) {
      const o = p * 4000 + i * 2;
      ui.screen.put(i % 80, Math.floor(i / 80), bytes[o] ?? 32, bytes[o + 1] ?? 7);
    }
    const k = await ui.keys.next();
    if (k.key === 'Escape') break;
  }
  ui.screen.restore(before);
}

/** qwindow: asks a question in a box; returns the answer or null for Esc. */
export async function askText(ui: Ui, question: string, maxLen: number, start = ''): Promise<string | null> {
  const s = ui.screen;
  const w = question.length + maxLen + 3;
  const x = Math.max(1, 40 - Math.floor(w / 2));
  const y = 11;
  const saved = s.window(x, y, w, 1, MENUATTR, SHADATTR);
  let answer = start;
  s.cursorVisible = true;
  try {
    for (;;) {
      s.write(x + 1, y, attr(14, 1), question);
      s.write(x + question.length + 2, y, attr(15, 1), answer.padEnd(maxLen));
      s.cursorX = x + question.length + 2 + answer.length;
      s.cursorY = y;
      const k = await ui.keys.next();
      if (k.key === 'Escape') return null;
      if (k.key === 'Enter') return answer;
      if (k.key === 'Backspace') answer = answer.slice(0, -1);
      else if (k.key.length === 1 && answer.length < maxLen) answer += k.key;
    }
  } finally {
    s.cursorVisible = false;
    s.restore(saved);
  }
}
