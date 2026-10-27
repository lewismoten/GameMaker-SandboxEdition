// The data bus rides' pictures, in the next stage's palette: the whole screen painted in
// perspective (the dark inside of the PC over the horizon, the bus of copper lines coming at
// the ship between two bundles of thin traces, the board on either side), the sign that
// counts the cycles, the progress bar, the destination chip and the way into it.
import { Pixels } from '../../../kit/pixels';
import { CLEAR, shadeAt, text } from '../art/draw';
import type { Pal } from '../art/pal';
import { HORIZON, VX, halfWidth } from './view';

export const W = 320;
export const H = 200;

/** The bundle of thin traces along each edge of the bus, wider as it comes nearer. */
const railWidth = (y: number) => 2 + (y - HORIZON) / 14;

/** The dark gap between two of the bus's copper lanes, wider as it comes nearer. */
const gapWidth = (y: number) => 0.6 + (y - HORIZON) / 50;

/** Which part of the picture a pixel is in, below the horizon. */
export function partAt(x: number, y: number): 'road' | 'gap' | 'rail' | 'board' {
  const d = Math.abs(x + 0.5 - VX) - halfWidth(y + 0.5);
  if (d < 0) return Math.abs(Math.abs(x + 0.5 - VX) - halfWidth(y + 0.5) / 3) < gapWidth(y + 0.5) ? 'gap' : 'road';
  if (d < railWidth(y + 0.5)) return 'rail';
  return 'board';
}

/** The board beside the bus: rows of solder pads, lit by a passing clock pulse or in the dark. */
export function boardTile(p: Pal, lit: boolean): Pixels {
  const t = new Pixels(20, 20);
  t.map((x, y) => shadeAt(p.r('base'), lit ? 2 : 0, lit ? 3 : 1, 0.5, x, y));
  // a row of pads across the middle, and a thin trace under it
  t.rect(0, 15, 20, 1, lit ? p.c('trim', 3) : p.c('base', 2));
  for (const x of [3, 13]) {
    t.rect(x, 7, 4, 4, lit ? p.c('trim', 5) : p.c('trim', 1));
    t.set(x + 1, 8, lit ? p.c('gray', 7) : p.c('trim', 2));
    t.rect(x + 1, 11, 2, 4, lit ? p.c('trim', 3) : p.c('base', 2));
  }
  return t;
}

/** The bus itself: copper, dark far off and bright near, in one shade a block row (so a row's cells match). */
export const roadShade = (p: Pal, x: number, y: number) => shadeAt(p.r('trim'), 0, 2.6, (Math.floor(y / 20) - 3) / 6, x, y);

/** The whole screen as one picture: the inside of the PC above the horizon, the bus and the board below. */
export function basePicture(p: Pal): Pixels {
  const pic = new Pixels(W, H);
  const dark = boardTile(p, false);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (y < 40) pic.set(x, y, skyAt(p, x, y));
      else if (y < HORIZON) pic.set(x, y, hazeAt(p, x, y));
      else {
        const part = partAt(x, y);
        if (part === 'road') pic.set(x, y, y < HORIZON + 20 ? p.c('trim', 0) : roadShade(p, x, y));
        else if (part === 'gap') pic.set(x, y, p.c('deep', 0));
        else if (part === 'rail') pic.set(x, y, railAt(p, x, y));
        else pic.set(x, y, y < HORIZON + 20 ? shadeAt(p.r('base'), 0, 1, (y - HORIZON) / 20, x, y) : dark.get(x % 20, y % 20));
      }
    }
  // a thin bright line where the far board meets the bus's end
  for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - VX) > 1) pic.set(x, HORIZON, p.c('glow', 2));
  return pic;
}

/** The dark inside of the case, the same in every block (a few far-off LEDs). */
export function skyAt(p: Pal, x: number, y: number): number {
  const xx = x % 20;
  const yy = y % 20;
  if ((xx === 4 && yy === 6) || (xx === 15 && yy === 15)) return p.c('deep', 2);
  return p.c('deep', 0);
}

/** Over the horizon, the far side of the board glows, with far-off parts standing on it. */
function hazeAt(p: Pal, x: number, y: number): number {
  const t = (y - 40) / 20;
  const c = shadeAt(p.r('base'), 0, 2, t ** 1.6, x, y);
  // far-off parts standing on it, the same in every block: a capacitor and a low chip
  const xx = x % 20;
  if (Math.abs(xx + 0.5 - 4) < 2 && y >= HORIZON - 7) return y === HORIZON - 7 ? p.c('steel', 3) : p.c('deep', 2);
  if (xx >= 9 && xx < 18 && y >= HORIZON - 3) return y === HORIZON - 3 ? p.c('deep', 3) : p.c('deep', 1);
  return c;
}

/** The bundle along each edge: three thin copper traces on the board, the inner one brightest. */
function railAt(p: Pal, x: number, y: number): number {
  const d = Math.abs(x + 0.5 - VX) - halfWidth(y + 0.5);
  const f = d / railWidth(y + 0.5);
  if (f < 0.22) return p.c('trim', 6);
  if (f < 0.38) return p.c('deep', 0);
  if (f > 0.5 && f < 0.66) return p.c('trim', 4);
  if (f > 0.82) return p.c('trim', 2);
  return p.c('base', 0);
}

/** The sign, 3 blocks by 2: where the bus goes, then BUS: and the cycles left. */
export function signBoard(p: Pal, dest: string): Pixels {
  const s = new Pixels(60, 40);
  s.rect(0, 0, 60, 40, p.c('deep', 0));
  s.rect(2, 2, 56, 36, p.c('deep', 1)).frame(2, 2, 56, 36, p.c('glow', 3)).frame(3, 3, 54, 34, p.c('glow', 1));
  text(s, 30 - dest.length * 4, 7, dest, p.c('gray', 7));
  text(s, 6, 25, 'BUS', p.c('glow', 4));
  s.rect(32, 27, 2, 2, p.c('glow', 4)).rect(32, 31, 2, 2, p.c('glow', 4));
  return s;
}

/** The sign's right bottom block, with the cycles left in a big digit. */
export function signDigit(p: Pal, board: Pixels, s: string, ink: number): Pixels {
  const cell = board.crop(40, 20, 20, 20);
  const q = new Pixels(20, 20);
  q.px.set(cell.px);
  const glyph = new Pixels(8, 8, CLEAR);
  text(glyph, 0, 0, s, ink);
  q.rect(1, 2, 15, 16, p.c('deep', 1));
  // twice as tall as the letters, and a pixel bolder
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      if (glyph.get(x, y) === ink)
        q.set(4 + x, 3 + y * 2, ink)
          .set(4 + x, 4 + y * 2, ink)
          .set(5 + x, 3 + y * 2, ink)
          .set(5 + x, 4 + y * 2, ink);
  return q;
}

/** The progress bar's pieces: its caps (the right one a little chip, the bus's end) and a cell at 0, 1 or 2 halves full. */
export function barCell(p: Pal, kind: 'L' | 'R' | 0 | 1 | 2): Pixels {
  const t = new Pixels(20, 20);
  t.map((x, y) => skyAt(p, x, y));
  if (kind === 'L') {
    t.rect(14, 5, 6, 1, p.c('steel', 5)).rect(14, 14, 6, 1, p.c('steel', 3)).rect(14, 5, 1, 10, p.c('steel', 5));
    for (let i = 0; i < 4; i++) t.set(6 + i, 6 + i, p.c('glow', 3)).set(6 + i, 13 - i, p.c('glow', 3));
    return t;
  }
  if (kind === 'R') {
    t.rect(0, 5, 3, 1, p.c('steel', 5)).rect(0, 14, 3, 1, p.c('steel', 3)).rect(2, 5, 1, 10, p.c('steel', 3));
    // the chip at the end of the line
    t.rect(6, 6, 10, 8, p.c('ink', 0)).frame(6, 6, 10, 8, p.c('steel', 2));
    for (let x = 7; x < 16; x += 2) t.set(x, 5, p.c('steel', 5)).set(x, 14, p.c('steel', 5));
    t.set(8, 8, p.c('glow', 4));
    return t;
  }
  t.rect(0, 5, 20, 1, p.c('steel', 5)).rect(0, 14, 20, 1, p.c('steel', 3));
  t.rect(0, 6, 20, 8, p.c('ink', 0));
  for (let h = 0; h < kind; h++) {
    t.rect(h * 10 + 1, 7, 8, 6, p.c('glow', 3))
      .rect(h * 10 + 1, 7, 8, 1, p.c('glow', 4))
      .rect(h * 10 + 1, 12, 8, 1, p.c('glow', 1));
  }
  return t;
}

/** The way into the chip, lit: the middle lane glows, with chevrons marching up it. */
export function exitLit(p: Pal, base: Pixels, cx: number, cy: number, k: number): Pixels {
  const t = base.crop(cx * 20, cy * 20, 20, 20);
  for (let y = 0; y < 20; y++) {
    const sy = cy * 20 + y;
    const half = Math.max(1, halfWidth(sy + 0.5) / 3 - 1);
    for (let x = 0; x < 20; x++) if (Math.abs(cx * 20 + x + 0.5 - VX) < half) t.set(x, y, p.c('glow', 2));
  }
  for (let i = 0; i < 2; i++) {
    const y0 = ((i * 10 + (k ? 5 : 0)) % 20) + 2;
    const mx = VX - cx * 20;
    for (let j = 0; j < 4; j++) t.set(mx - j, y0 + j, p.c('gray', 7)).set(mx + j - 1, y0 + j, p.c('gray', 7));
  }
  return t;
}
