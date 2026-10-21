// ANSI art for the BBSes, drawn straight into the text screen with CP437 block
// characters: big shaded letters, fade bars, sand dunes, a sand castle, a pail and
// shovel, and a sofa, the way 1990s BBS screens looked.
import { attr, COLS, type TextScreen } from './text/textScreen';
import { toCp437 } from './text/cp437';

/** 5x5 block letters. */
const FONT: Record<string, string[]> = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '#  ##', '#   #', ' ### '],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  '-': ['     ', '     ', ' ### ', '     ', '     '],
  ' ': ['   ', '   ', '   ', '   ', '   '],
};

const FULL = 219; // █
const SHADE = 176; // ░

/** Width in columns; `wide` draws each font pixel two columns wide. */
export function bigTextWidth(text: string, wide = false): number {
  const px = wide ? 2 : 1;
  return [...text].reduce((w, c) => w + (FONT[c]?.[0].length ?? 3) * px + 1, -1);
}

/** Big letters with a dark drop shadow; `rows` gives a color per row (top to bottom). */
export function bigText(s: TextScreen, x: number, y: number, text: string, rows: number[], wide = false): void {
  const px = wide ? 2 : 1;
  const cells: [number, number][] = [];
  let cx = x;
  for (const c of text) {
    const g = FONT[c] ?? FONT[' '];
    g.forEach((line, r) => [...line].forEach((p, i) => p === '#' && Array.from({ length: px }, (_, k) => cells.push([cx + i * px + k, y + r]))));
    cx += g[0].length * px + 1;
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

/** A picture: rows of characters, and rows of hex foreground colors ('.' or space = skip). */
function art(s: TextScreen, x: number, y: number, chars: string[], colors: string[]): void {
  chars.forEach((row, r) =>
    [...toCp437(row)].forEach((ch, i) => {
      const c = colors[r]?.[i] ?? '.';
      if (ch !== ' ' && c !== '.' && c !== ' ') s.put(x + i, y + r, ch.charCodeAt(0), attr(parseInt(c, 16), 0));
    }),
  );
}

/** Rolling sand dunes across the screen, `rows` tall. */
export function sandDunes(s: TextScreen, y: number, rows: number): void {
  for (let x = 0; x < COLS; x++) {
    const height = Math.max(1, Math.min(rows, Math.round(rows / 2 + 0.5 + (rows / 3) * Math.sin(x / 7) + (rows / 6) * Math.sin(x / 2.7 + 1))));
    const top = y + rows - height;
    s.put(x, top, 220, attr(14, 0)); // ▄
    for (let r = top + 1; r < y + rows; r++) s.put(x, r, (x * 7 + r * 3) % 5 === 0 ? 176 : 177, attr(6, 14)); // ░▒ on sand
  }
}

const CASTLE = [
  '  ▄ ▄ ▄    ►    ▄ ▄ ▄',
  '  █████    █    █████',
  '   ███   ▄███▄   ███ ',
  '   ███▄▄▄█████▄▄▄███ ',
  '   ███████▀▀▀███████ ',
];
const CASTLE_COLORS = [
  '  e e e    c    e e e',
  '  eeeee    7    eeeee',
  '   eee   eeeee   eee ',
  '   eeeeeeeeeeeeeeeee ',
  '   eeeeeee666eeeeeee ',
];

const PAIL = [
  '  ▄▀▀▀▀▄     ▄ ',
  ' ▐██████▌   ▐█▌',
  '  ▐████▌     █ ',
  '   ▀▀▀▀     ▄█▄',
];
const PAIL_COLORS = [
  '  777777     9 ',
  ' 4cccccc4   999',
  '  4cccc4     1 ',
  '   4444     999',
];

/** The board's name the way it was always shown: a different color for each letter, white and yellow ends. */
const SANDBOX_COLORS = [12, 14, 10, 11, 9, 13, 6];

export const SANDBOX_ANSI = '|15-|14= |12S |14A |10N |11D |09B |13O |06X |14=|15-';

/** The logon screen of THE -= S A N D B O X =- BBS. Returns the first free row. */
export function sandboxLogin(s: TextScreen): number {
  s.fill(0, 0, COLS - 1, 23, attr(7, 0));
  fadeBar(s, 0, 6);
  let lx = Math.floor((COLS - bigTextWidth('SANDBOX', true)) / 2);
  [...'SANDBOX'].forEach((c, i) => {
    bigText(s, lx, 2, c, Array(5).fill(SANDBOX_COLORS[i]), true);
    lx += bigTextWidth(c, true) + 1;
  });
  centered(s, 8, `|07THE ${SANDBOX_ANSI} |07BBS`);
  centered(s, 9, '|07Pittsburgh, PA |08· |0714,400 bps |08· |07Running Renegade |08· |07SysOp: |14Lewis');
  centered(s, 10, '|14Grab a pail and play in the sand!');
  centered(s, 11, '|11Game-Maker shareware |08· |11Designer tips |08· |11Bulletins');
  sandDunes(s, 16, 4);
  art(s, 3, 12, CASTLE, CASTLE_COLORS);
  art(s, 61, 13, PAIL, PAIL_COLORS);
  return 21;
}

/** A short sandy banner at the top of a screen. */
export function sandBanner(s: TextScreen, title: string): void {
  fadeBar(s, 0, 6);
  centered(s, 0, `|14 ${title} `);
}

const SOFA = [
  '  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  ',
  ' ██▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀██ ',
  '▄██ ▄▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄▄ ██▄',
  '██████████████████████████',
  '██▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀██',
  ' ▀▀                    ▀▀ ',
];
const SOFA_COLORS = [
  '  555555555555555555555  ',
  ' 55dddddddddddddddddd55 ',
  '55dddddddddddddddddddddd55',
  '55555555555555555555555555',
  '55dddddddddddddddddddddd55',
  ' 66                    66 ',
];

/** The logon screen of The Sofa, a multi-line Major BBS. Returns the first free row. */
export function sofaLogin(s: TextScreen, line: number, lines: number): number {
  s.fill(0, 0, COLS - 1, 23, attr(7, 0));
  fadeBar(s, 0, 5);
  bigText(s, Math.floor((COLS - bigTextWidth('THE SOFA')) / 2), 2, 'THE SOFA', [13, 13, 5, 5, 5]);
  art(s, 27, 8, SOFA, SOFA_COLORS);
  centered(s, 14, '|06>>|14  The Home of the GOAT  |06<<');
  centered(s, 15, `|15Pittsburgh's place to kick back |08· |13${lines} lines |08· |07The Major BBS`);
  centered(s, 16, `|07You are connected on line |14${String(line).padStart(2, '0')}`);
  fadeBar(s, 17, 5);
  return 19;
}
