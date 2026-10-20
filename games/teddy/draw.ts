// Drawing helpers shared by the blocks, sprites and screens: dithered shading, lumps,
// textures, ASCII sprites, the PC's 8x8 font and a 3x5 font for tiny signs.
import { FONT8X8 } from '../../web/src/gfx/font8x8';
import { Pixels, dither, rng } from '../kit/pixels';

export const CLEAR = 255;

/** A shade between ramp[lo] and ramp[hi] for level 0..1, ordered-dithered at (x, y). */
export function shadeAt(ramp: number[], lo: number, hi: number, level: number, x: number, y: number): number {
  const v = lo + Math.max(0, Math.min(1, level)) * (hi - lo);
  const base = Math.floor(v);
  const idx = dither(x, y, v - base) ? base + 1 : base;
  return ramp[Math.max(0, Math.min(ramp.length - 1, idx))];
}

/** A lit ellipsoid lump (bush, rock, balloon, treat), light from the upper left. */
export function blob(p: Pixels, cx: number, cy: number, rx: number, ry: number, ramp: number[], lo: number, hi: number, light = 1): Pixels {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      const l = (0.62 * z - 0.42 * nx - 0.52 * ny) * light;
      p.set(x, y, shadeAt(ramp, lo, hi, (l + 0.35) / 1.2, x, y));
    }
  return p;
}

/** Fills a rectangle with a speckled texture around ramp[base]. */
export function speckle(
  p: Pixels,
  x0: number,
  y0: number,
  w: number,
  h: number,
  ramp: number[],
  base: number,
  spread: number,
  seed: number,
  density = 0.25,
): Pixels {
  const r = rng(seed);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      let k = base;
      if (r() < density) k += r() < 0.5 ? -spread : spread;
      p.set(x, y, ramp[Math.max(0, Math.min(ramp.length - 1, k))]);
    }
  return p;
}

/** A vertical gradient across a rectangle. */
export function gradient(p: Pixels, x0: number, y0: number, w: number, h: number, ramp: number[], lo: number, hi: number): Pixels {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) p.set(x, y, shadeAt(ramp, lo, hi, (y - y0) / Math.max(1, h - 1), x, y));
  return p;
}

/** Recolors every pixel through a lookup. */
export function recolor(src: Pixels, fn: (c: number) => number): Pixels {
  const p = new Pixels(src.w, src.h);
  p.px.set(src.px.map(fn));
  return p;
}

/** An ASCII sprite on a clear 20x20 block, bottom aligned and centered unless placed. */
export function sprite(rows: string[], key: Record<string, number>, dx?: number, dy?: number, w = 20, h = 20): Pixels {
  const p = new Pixels(w, h, CLEAR);
  const width = Math.max(...rows.map((r) => r.length));
  p.draw(dx ?? Math.floor((w - width) / 2), dy ?? h - rows.length, rows, key);
  return p;
}

/** Draws a dark outline around every non-clear pixel (onto clear neighbors). */
export function outline(src: Pixels, ink: number): Pixels {
  const p = new Pixels(src.w, src.h);
  p.px.set(src.px);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      if (src.get(x, y) !== CLEAR) continue;
      const near = [src.get(x - 1, y), src.get(x + 1, y), src.get(x, y - 1), src.get(x, y + 1)].some((c) => c !== CLEAR && c !== -1 && c !== ink);
      if (near) p.set(x, y, ink);
    }
  return p;
}

/** Copies a picture with clear (255) pixels skipped. */
export function over(dst: Pixels, src: Pixels, x = 0, y = 0): Pixels {
  return dst.blit(src, x, y, CLEAR);
}

/**
 * The Klown Klub spells itself with backwards K's. In art (signs, titles, cartoons) a
 * MIRROR_K draws a mirrored K; plain text (the .TXT pages) keeps ordinary K's.
 */
export const MIRROR_K = '\ua4d8';

/** The backwards K in the PC font's style (the font's own K mirrored keeps its serifs and reads as an X). */
const BACKWARDS_K = ['##...##.', '.##..##.', '..##.##.', '...####.', '..##.##.', '.##..##.', '##...##.', '........'];

/** Turns every "KLOWN KLUB" (any case) into its sign spelling, backwards K's and all. */
export function klubArt(s: string): string {
  return s.replace(/k(lown)/gi, (_, rest: string) => MIRROR_K + rest).replace(/k(lub)/gi, (_, rest: string) => MIRROR_K + rest);
}

/** Draws 8x8 text; `scale` makes chunky letters. Returns the width drawn. */
export function text(p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number {
  let cx = x;
  for (const ch of s) {
    const base = (ch.charCodeAt(0) & 0xff) * 8;
    for (let row = 0; row < 8; row++) {
      if (ch === MIRROR_K) {
        for (let b = 0; b < 8; b++) if (BACKWARDS_K[row][b] === '#') p.rect(cx + b * scale, y + row * scale, scale, scale, col);
        continue;
      }
      const bits = FONT8X8[base + row];
      for (let b = 0; b < 8; b++) if (bits & (1 << b)) p.rect(cx + b * scale, y + row * scale, scale, scale, col);
    }
    cx += 8 * scale;
  }
  return cx - x;
}

export const textWidth = (s: string, scale = 1) => s.length * 8 * scale;

/** Text with a 1px outline (and an optional drop shadow). */
export function outlined(p: Pixels, x: number, y: number, s: string, col: number, edge: number, scale = 1, shadow?: number): void {
  if (shadow !== undefined) text(p, x + scale, y + scale * 2, s, shadow, scale);
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
  ])
    text(p, x + dx, y + dy, s, edge, scale);
  text(p, x, y, s, col, scale);
}

export function centered(p: Pixels, y: number, s: string, col: number, scale = 1, edge?: number, cx = p.w / 2): void {
  const x = Math.round(cx - textWidth(s, scale) / 2);
  if (edge !== undefined) outlined(p, x, y, s, col, edge, scale);
  else text(p, x, y, s, col, scale);
}

const MICRO: Record<string, string> = {
  A: '010101111101101',
  B: '110101110101110',
  C: '011100100100011',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '011100101101011',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101010',
  K: '101101110101101',
  [MIRROR_K]: '101101011101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '010101101101010',
  P: '110101110100100',
  Q: '010101101110011',
  R: '110101110101101',
  S: '011100010001110',
  T: '111010010010010',
  U: '101101101101111',
  V: '101101101101010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '110001010100111',
  '3': '110001010001110',
  '4': '101101111001001',
  '5': '111100110001110',
  '6': '011100111101111',
  '7': '111001010010010',
  '8': '111101111101111',
  '9': '111101111001110',
  $: '011110010011110',
  '&': '010101010101011',
  '-': '000000111000000',
  '!': '010010010000010',
  '.': '000000000000010',
  "'": '010010000000000',
  ' ': '000000000000000',
  ':': '000010000010000',
  '/': '001001010100100',
  ',': '000000000010100',
  '?': '110001010000010',
  '+': '000010111010000',
};

/** 3x5 letters, 1px apart. Returns the width drawn. */
export function micro(p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = MICRO[ch] ?? MICRO[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') p.rect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale, col);
    cx += 4 * scale;
  }
  return cx - x - scale;
}

export const microWidth = (s: string, scale = 1) => s.length * 4 * scale - scale;

/** Scales a picture up by an integer factor into dst (clear pixels skipped). */
export function scaleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false): void {
  for (let yy = 0; yy < src.h; yy++)
    for (let xx = 0; xx < src.w; xx++) {
      const c = src.get(flip ? src.w - 1 - xx : xx, yy);
      if (c !== CLEAR && c >= 0) dst.rect(x + xx * s, y + yy * s, s, s, c);
    }
}
