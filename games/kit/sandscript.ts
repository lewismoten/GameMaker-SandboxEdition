// Sandscript: the Sandbox games' own secret alphabet, for little messages hidden in the games.
// Every letter hangs from a rim, a line along the top like the edge of a sandbox, and the rim
// runs on unbroken through a word, so a word is one string of shapes with a gap at each space.
// Under the rim a letter is a few strokes and pebbles (dots) on a 3 × 3 grid of points. The
// glyphs were made for this project (Claude, Anthropic); they are not taken from any other
// alphabet or cipher. The only key to it is the folded note hidden in the Library room
// (web/src/library/sandNote.ts), and web/src/library/sandscript.test.ts keeps the note and this
// file in step.
// No imports, so the browser and the game builds can both load it.

/** A point of a letter's grid: x 0-2 left to right, y 0-2 top (the rim) to bottom. */
export type SandPoint = readonly [x: number, y: number];

/** One letter under the rim: straight strokes between grid points, and pebbles at points. */
export interface SandGlyph {
  strokes: readonly (readonly [SandPoint, SandPoint])[];
  dots: readonly SandPoint[];
}

// the grid's points by name: the rim's row a b c, the middle d e f, the bottom g h i
const P = {
  a: [0, 0],
  b: [1, 0],
  c: [2, 0],
  d: [0, 1],
  e: [1, 1],
  f: [2, 1],
  g: [0, 2],
  h: [1, 2],
  i: [2, 2],
} as const satisfies Record<string, SandPoint>;
type Name = keyof typeof P;

/** "ag ce" = strokes a-g and c-e; "." before a name is a pebble there. */
function glyph(spec: string): SandGlyph {
  const strokes: [SandPoint, SandPoint][] = [];
  const dots: SandPoint[] = [];
  for (const part of spec.split(' ').filter(Boolean)) {
    if (part.startsWith('.')) dots.push(P[part[1] as Name]);
    else strokes.push([P[part[0] as Name], P[part[1] as Name]]);
  }
  return { strokes, dots };
}

/** The 26 letters. The commonest (E, T, A, O, I, N, S, H) take one mark each, and any two differ by at least three pixels at scale 2. */
export const SANDSCRIPT: Readonly<Record<string, SandGlyph>> = Object.freeze({
  A: glyph('ag'),
  B: glyph('bh gi'),
  C: glyph('ag ci'),
  D: glyph('ag gi'),
  E: glyph('.h'),
  F: glyph('ag df'),
  G: glyph('ci df'),
  H: glyph('gi'),
  I: glyph('ai'),
  J: glyph('ad .i'),
  K: glyph('ad cf'),
  L: glyph('ci gi'),
  M: glyph('bh df'),
  N: glyph('cg'),
  O: glyph('ci'),
  P: glyph('.g .i'),
  Q: glyph('cg ci'),
  R: glyph('ae ec'),
  S: glyph('df'),
  T: glyph('bh'),
  U: glyph('ai cg'),
  V: glyph('ae ec gi'),
  W: glyph('df gi'),
  X: glyph('cf .g'),
  Y: glyph('ag ci gi'),
  Z: glyph('ai ci'),
});

/** The alphabet's name, as the note in the Library prints it. */
export const SANDSCRIPT_NAME = 'Sandscript';

/** A message as Sandscript writes it: capitals A-Z and single spaces; anything else is dropped. */
export function sandText(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z ]+/g, '')
    .replace(/ +/g, ' ')
    .trim();
}

/** A letter is this many grid steps wide, with one more step of rim between letters. */
const CELL = 3;

/**
 * A message as 0/1 pixels, `scale` pixels to a grid step (2 makes letters 5 × 5 with a pixel of
 * rim between them: three letters to a 20-pixel block). Pebbles are one pixel at scale 2 and grow
 * to a 3 × 3 square at scale 4. Rows top to bottom; width is `cols`.
 */
export function sandPixels(text: string, scale = 2): { cols: number; rows: number; px: Uint8Array } {
  const words = sandText(text).split(' ').filter(Boolean);
  const letter = (CELL - 1) * scale + 1;
  const space = 2 * scale + 1;
  const wordWidth = (w: string) => w.length * letter + (w.length - 1) * (scale - 1);
  const cols = Math.max(0, words.reduce((n, w) => n + wordWidth(w), 0) + (words.length - 1) * space);
  const rows = (CELL - 1) * scale + 1;
  const px = new Uint8Array(cols * rows);
  const set = (x: number, y: number) => {
    if (x >= 0 && x < cols && y >= 0 && y < rows) px[y * cols + x] = 1;
  };
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) set(Math.round(x0 + ((x1 - x0) * k) / (n || 1)), Math.round(y0 + ((y1 - y0) * k) / (n || 1)));
  };
  let x = 0;
  for (const w of words) {
    // the rim runs the whole word
    line(x, 0, x + wordWidth(w) - 1, 0);
    for (const ch of w) {
      const g = SANDSCRIPT[ch];
      for (const [[ax, ay], [bx, by]] of g.strokes) line(x + ax * scale, ay * scale, x + bx * scale, by * scale);
      const r = Math.floor(scale / 4);
      for (const [dx, dy] of g.dots) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) set(x + dx * scale + i, dy * scale + j);
      x += letter + (scale - 1);
    }
    x += space - (scale - 1);
  }
  return { cols, rows, px };
}
