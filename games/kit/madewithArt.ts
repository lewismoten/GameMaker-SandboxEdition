// What the flat "Made with Game-Maker: Sandbox Edition" openings share (madewithMore.ts makes
// them; madewith.ts is the ray-traced one): one palette in the site's colors, the navy sky with
// its faint 20x20 block lines, a wall of the site's glossy blue blocks, GAME-MAKER built of
// little gold blocks (each dot of the PC's 8x8 font one block), and lines of 8x8 lettering with
// a dark outline and drop shadow (MADE WITH, SANDBOX EDITION with SANDBOX in THE SANDBOX BBS's
// colors). Every picture is a whole 320x200 screen of palette indexes.
import { FONT8X8 } from '../../web/src/gfx/font8x8';
import { Pixels } from './pixels';

export const W = 320;
export const H = 200;

// ---- the palette (6-bit VGA) ----------------------------------------------------------

export const BLACK = 0;
export const WHITE = 1;
/** S A N D B O X, a color a letter (2..8). */
const RAINBOW = 2;
const INK = 9;
/** The navy sky, top (dark) to bottom (the icon's blue), and the same a little lighter for block lines. */
const SKY = 16;
const SKY_N = 32;
const GRID = SKY + SKY_N;
/** A glossy blue block: face, lit bevel, shaded bevel, the gap between blocks. */
export const BLUE = { face: 90, lit: 91, shade: 92, gap: 93, glow: 94 };
/** A gold block: face, lit edge, shaded edge, the extrusion behind it, and the shine. */
export const GOLD = { face: 100, lit: 101, shade: 102, deep: 103, shine: 104 };
/** The DOS prompt's gray. */
export const GRAY = 110;

export function madeWithPalette(): Uint8Array {
  const p = new Uint8Array(768);
  const put = (i: number, c: number[]) => p.set(c, i * 3);
  put(WHITE, [63, 63, 63]);
  // CGA's light red, yellow, green, cyan, blue, magenta and brown, as madewith.ts
  [
    [63, 21, 21],
    [63, 63, 21],
    [21, 63, 21],
    [21, 63, 63],
    [21, 21, 63],
    [63, 21, 63],
    [42, 21, 0],
  ].forEach((c, i) => put(RAINBOW + i, c));
  put(INK, [0, 0, 6]);
  for (let i = 0; i < SKY_N; i++) {
    const t = i / (SKY_N - 1);
    // #00002a at the top to the icon's #1d3fbf at the bottom, as the presents card
    const c = [Math.round(7 * t), Math.round(15 * t), Math.round(10 + 37 * t)];
    put(SKY + i, c);
    put(GRID + i, [Math.min(63, c[0] + 4), Math.min(63, c[1] + 6), Math.min(63, c[2] + 8)]);
  }
  put(BLUE.face, [7, 16, 48]); // #1d3fbf
  put(BLUE.lit, [23, 29, 52]);
  put(BLUE.shade, [4, 10, 30]);
  put(BLUE.gap, [0, 0, 22]);
  put(BLUE.glow, [40, 48, 63]);
  put(GOLD.face, [63, 53, 0]); // #ffd400
  put(GOLD.lit, [63, 61, 34]);
  put(GOLD.shade, [50, 36, 0]);
  put(GOLD.deep, [30, 17, 0]);
  put(GOLD.shine, [63, 63, 52]);
  put(GRAY, [42, 42, 42]);
  return p;
}

// ---- backgrounds ----------------------------------------------------------------------

/** The navy sky, darkest at the top, with the site icon's faint 20x20 block lines. */
export function sky(): Pixels {
  return new Pixels(W, H).map((x, y) => (x % 20 === 0 || y % 20 === 0 ? GRID : SKY) + Math.min(SKY_N - 1, Math.floor((y * SKY_N) / H)));
}

/** One glossy blue 20x20 block at (x, y), `h` rows tall (a block turning over is shorter), centered on its row. */
export function blueBlock(p: Pixels, x: number, y: number, h = 20, lit = false): void {
  const top = y + Math.floor((20 - h) / 2);
  p.rect(x, top, 20, h, BLUE.gap);
  if (h < 3) return;
  p.rect(x + 1, top + 1, 18, h - 2, lit ? BLUE.glow : BLUE.face);
  if (lit) return;
  p.rect(x + 1, top + 1, 18, Math.min(2, h - 2), BLUE.lit).rect(x + 1, top + 1, 2, h - 2, BLUE.lit);
  if (h > 5) p.rect(x + 1, top + h - 3, 18, 2, BLUE.shade).rect(x + 17, top + 3, 2, h - 4, BLUE.shade);
}

/** The screen as a wall of blue blocks (16 across, 10 down). */
export function blockWall(): Pixels {
  const p = new Pixels(W, H);
  for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x += 20) blueBlock(p, x, y);
  return p;
}

// ---- GAME-MAKER in gold blocks ------------------------------------------------------------

export const LOGO = 'GAME-MAKER';
/** A font dot's size on screen. */
export const DOT_W = 4;
export const DOT_H = 5;
/** Where the logo's top-left dot sits. */
const LOGO_Y = 74;

/** One gold block of the logo: its place on screen, and which letter of LOGO it belongs to. */
export interface Dot {
  x: number;
  y: number;
  letter: number;
  /** Its column and row in the letter's 8x8 glyph. */
  col: number;
  row: number;
}

/** The columns of a glyph that have a dot. */
function glyphCols(ch: string): number[] {
  const g = ch.charCodeAt(0) * 8;
  const cols: number[] = [];
  for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) if (FONT8X8[g + y] & (1 << x)) (cols.push(x), (y = 8));
  return cols;
}

let dots: Dot[] | undefined;
/** Every dot of GAME-MAKER, the letters packed one dot apart and the word centered. */
export function logoDots(): Dot[] {
  if (dots) return dots;
  const spans = [...LOGO].map((ch) => {
    const cols = glyphCols(ch);
    return { ch, first: Math.min(...cols), width: Math.max(...cols) - Math.min(...cols) + 1 };
  });
  const total = spans.reduce((n, s) => n + s.width, 0) + spans.length - 1;
  let pen = Math.round((W - total * DOT_W) / 2);
  dots = [];
  spans.forEach((s, letter) => {
    const g = s.ch.charCodeAt(0) * 8;
    for (let row = 0; row < 8; row++)
      for (let col = s.first; col < s.first + s.width; col++)
        if (FONT8X8[g + row] & (1 << col)) dots!.push({ x: pen + (col - s.first) * DOT_W, y: LOGO_Y + row * DOT_H, letter, col, row });
    pen += (s.width + 1) * DOT_W;
  });
  return dots;
}

/** The logo's screen box: [left, top, right, bottom] (the extrusion included). */
export function logoBox(): [number, number, number, number] {
  const ds = logoDots();
  return [Math.min(...ds.map((d) => d.x)), LOGO_Y, Math.max(...ds.map((d) => d.x)) + DOT_W + 2, LOGO_Y + 8 * DOT_H + 2];
}

/** The deep gold behind a block, two pixels down and right: the letters' thickness. */
export function goldDepth(p: Pixels, x: number, y: number): void {
  p.rect(x + 2, y + 2, DOT_W, DOT_H, GOLD.deep);
}

/** One gold block: its face, a lit top and left edge, a shaded bottom and right one. */
export function goldBlock(p: Pixels, x: number, y: number, face: number = GOLD.face): void {
  p.rect(x, y, DOT_W, DOT_H, face);
  if (face !== GOLD.face) return;
  p.rect(x, y, DOT_W, 1, GOLD.lit).rect(x, y, 1, DOT_H, GOLD.lit);
  p.rect(x + 1, y + DOT_H - 1, DOT_W - 1, 1, GOLD.shade).rect(x + DOT_W - 1, y + 1, 1, DOT_H - 1, GOLD.shade);
}

/** The whole logo at rest; `face` picks a block's face color (a shine passing over), GOLD.face by default. */
export function drawLogo(p: Pixels, face: (d: Dot) => number = () => GOLD.face, shown: (d: Dot) => boolean = () => true): void {
  const ds = logoDots().filter(shown);
  for (const d of ds) goldDepth(p, d.x, d.y);
  for (const d of ds) goldBlock(p, d.x, d.y, face(d));
}

// ---- 8x8 lettering ----------------------------------------------------------------------

/** Draws `text` (its first `shown` letters) in the 8x8 font at `s` pixels a dot, centered on cx (or from x0), outlined and shadowed. */
export function lettering(
  p: Pixels,
  text: string,
  at: { cx?: number; x?: number },
  y: number,
  s: number,
  ink: (i: number) => number,
  shown = text.length,
  outline = true,
): void {
  const x0 = at.x ?? Math.round((at.cx ?? W / 2) - (text.length * 8 * s) / 2);
  const ds: [number, number, number][] = [];
  for (let i = 0; i < Math.min(shown, text.length); i++) {
    const g = text.charCodeAt(i) * 8;
    for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 8; gx++) if (FONT8X8[g + gy] & (1 << gx)) ds.push([x0 + (i * 8 + gx) * s, y + gy * s, ink(i)]);
  }
  if (outline) {
    for (const [x, yy] of ds) p.rect(x + 1, yy + 1, s + s, s + s, INK); // shadow
    for (const [x, yy] of ds) p.rect(x - 1, yy - 1, s + 2, s + 2, INK); // outline
  }
  for (const [x, yy, c] of ds) p.rect(x, yy, s, s, c);
}

export const MADE = 'MADE WITH';
export const EDITION = 'SANDBOX EDITION';
const MADE_Y = 40;
const EDITION_Y = 136;

/** MADE WITH above the logo, its first `shown` letters. */
export const madeWith = (p: Pixels, shown = MADE.length) => lettering(p, MADE, {}, MADE_Y, 2, () => WHITE, shown);

/** SANDBOX EDITION below it, SANDBOX a color a letter. */
export const sandboxEdition = (p: Pixels, shown = EDITION.length) => lettering(p, EDITION, {}, EDITION_Y, 2, (i) => (i < 7 ? RAINBOW + i : WHITE), shown);

/** The card at rest: the sky, MADE WITH, the logo and SANDBOX EDITION. */
export function restCard(): Pixels {
  const p = sky();
  madeWith(p);
  drawLogo(p);
  sandboxEdition(p);
  return p;
}

/** A four-point star glint at (cx, cy), `r` pixels from its middle to an arm's tip. */
export function glint(p: Pixels, cx: number, cy: number, r: number): void {
  p.rect(cx - r, cy, 2 * r + 1, 1, GOLD.shine).rect(cx, cy - r, 1, 2 * r + 1, GOLD.shine);
  p.rect(cx - Math.floor(r / 2), cy, r + 1, 1, WHITE).rect(cx, cy - Math.floor(r / 2), 1, r + 1, WHITE);
  if (r >= 3) p.rect(cx - 1, cy - 1, 3, 3, WHITE);
}
