// ANSI art for the BBS, drawn straight into the text screen with CP437 block characters:
// big shaded letters, gradient bars and boxes, the way 1990s BBS screens looked.
import { attr, COLS, type TextScreen } from './textScreen';
import { toCp437 } from './cp437';

/** 5x5 block letters. */
const FONT: Record<string, string[]> = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  G: [' ####', '#    ', '#  ##', '#   #', ' ### '],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  '-': ['     ', '     ', ' ### ', '     ', '     '],
  ' ': ['   ', '   ', '   ', '   ', '   '],
};

const FULL = 219; // █
const SHADE = 176; // ░

export function bigTextWidth(text: string): number {
  return [...text].reduce((w, c) => w + (FONT[c]?.[0].length ?? 3) + 1, -1);
}

/** Big letters with a dark drop shadow; `rows` gives a color per row (top to bottom). */
export function bigText(s: TextScreen, x: number, y: number, text: string, rows: number[]): void {
  const cells: [number, number][] = [];
  let cx = x;
  for (const c of text) {
    const g = FONT[c] ?? FONT[' '];
    g.forEach((line, r) => [...line].forEach((p, i) => p === '#' && cells.push([cx + i, y + r])));
    cx += g[0].length + 1;
  }
  const on = new Set(cells.map(([a, b]) => `${a},${b}`));
  for (const [a, b] of cells) if (!on.has(`${a + 1},${b + 1}`)) s.put(a + 1, b + 1, SHADE, attr(8, 0));
  for (const [a, b] of cells) s.put(a, b, FULL, attr(rows[b - y] ?? 15, 0));
}

/** A full-width bar fading ░▒▓█▓▒░ in one color. */
export function fadeBar(s: TextScreen, y: number, fg: number, bg = 0): void {
  const ramp = [176, 177, 178, 219];
  for (let x = 0; x < COLS; x++) {
    const d = Math.min(x, COLS - 1 - x);
    s.put(x, y, ramp[Math.min(3, Math.floor(d / 3))], attr(fg, bg));
  }
}

/** Centered text with pipe color codes (|XX). */
export function centered(s: TextScreen, y: number, text: string): void {
  const plain = text.replace(/\|\d\d/g, '');
  let x = Math.max(0, Math.floor((COLS - plain.length) / 2));
  let fg = 7;
  toCp437(text)
    .split(/\|(\d\d)/)
    .forEach((p, i) => {
      if (i % 2) fg = Number(p) & 15;
      else for (const ch of p) s.put(x++, y, ch.charCodeAt(0), attr(fg, 0));
    });
}

/** The logon screen of THE GAME-MAKER EXCHANGE. Returns the first free row. */
export function loginScreen(s: TextScreen): number {
  s.fill(0, 0, COLS - 1, 23, attr(7, 0));
  fadeBar(s, 0, 1);
  const top = 'GAME-MAKER';
  bigText(s, Math.floor((COLS - bigTextWidth(top)) / 2), 2, top, [14, 14, 12, 12, 4]);
  const bottom = 'EXCHANGE';
  bigText(s, Math.floor((COLS - bigTextWidth(bottom)) / 2), 8, bottom, [11, 11, 9, 9, 1]);
  fadeBar(s, 14, 5);
  centered(s, 15, '|15Node 1 |08· |0714,400 bps |08· |07Est. 1993 |08· |07SysOp: |14The Designer');
  centered(s, 16, '|11Shareware made with Game-Maker |08· |11Help for game designers');
  fadeBar(s, 17, 5);
  return 19;
}
