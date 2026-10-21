// Drawing helpers for blocks, sprites and screens: dithered shading, lumps, the PC's 8x8
// font (scaled, outlined) and a 3x5 font small enough to letter a door plate on one block.
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { Pixels, dither, rng } from '../../../kit/pixels';

export const CLEAR = 255;

/** A shade between ramp[lo] and ramp[hi] for level 0..1, ordered-dithered at (x, y). */
export function shadeAt(r: number[], lo: number, hi: number, level: number, x: number, y: number): number {
  const v = lo + Math.max(0, Math.min(1, level)) * (hi - lo);
  const base = Math.floor(v);
  const idx = dither(x, y, v - base) ? base + 1 : base;
  return r[Math.max(0, Math.min(r.length - 1, idx))];
}

/** A lit ellipsoid lump, light from the upper left. */
export function blob(p: Pixels, cx: number, cy: number, rx: number, ry: number, r: number[], lo: number, hi: number, light = 1): Pixels {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      const l = (0.62 * z - 0.42 * nx - 0.52 * ny) * light;
      p.set(x, y, shadeAt(r, lo, hi, (l + 0.35) / 1.2, x, y));
    }
  return p;
}

/** Speckled texture around r[base]. */
export function speckle(
  p: Pixels,
  x0: number,
  y0: number,
  w: number,
  h: number,
  r: number[],
  base: number,
  spread: number,
  seed: number,
  density = 0.25,
): Pixels {
  const R = rng(seed);
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      let k = base;
      if (R() < density) k += R() < 0.5 ? -spread : spread;
      p.set(x, y, r[Math.max(0, Math.min(r.length - 1, k))]);
    }
  return p;
}

/** A vertical gradient. */
export function gradient(p: Pixels, x0: number, y0: number, w: number, h: number, r: number[], lo: number, hi: number): Pixels {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) p.set(x, y, shadeAt(r, lo, hi, (y - y0) / Math.max(1, h - 1), x, y));
  return p;
}

/** A soft radial pool of light (spotlight, lamp) mixing toward ramp shades. */
export function pool(p: Pixels, cx: number, cy: number, rx: number, ry: number, r: number[], lo: number, hi: number): Pixels {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d > 1) continue;
      p.set(x, y, shadeAt(r, lo, hi, 1 - d, x, y));
    }
  return p;
}

/** 8x8 text; `scale` makes chunky letters. Returns the width drawn. */
export function text(p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number {
  let cx = x;
  for (const ch of s) {
    const base = (ch.charCodeAt(0) & 0xff) * 8;
    for (let row = 0; row < 8; row++) {
      const bits = FONT8X8[base + row];
      for (let b = 0; b < 8; b++) if (bits & (1 << b)) p.rect(cx + b * scale, y + row * scale, scale, scale, col);
    }
    cx += 8 * scale;
  }
  return cx - x;
}

export const textWidth = (s: string, scale = 1) => s.length * 8 * scale;

/** Text with an outline (and an optional drop shadow). */
export function outlined(p: Pixels, x: number, y: number, s: string, col: number, outline: number, scale = 1, shadow?: number): void {
  if (shadow !== undefined) text(p, x + scale + 1, y + scale + 1, s, shadow, scale);
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
    text(p, x + dx, y + dy, s, outline, scale);
  text(p, x, y, s, col, scale);
}

export function centered(p: Pixels, y: number, s: string, col: number, scale = 1, outline?: number, cx = p.w / 2): void {
  const x = Math.round(cx - textWidth(s, scale) / 2);
  if (outline !== undefined) outlined(p, x, y, s, col, outline, scale);
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
  '"': '101101000000000',
  '?': '110001010000010',
  '#': '101111101111101',
  '+': '000010111010000',
};

/** 3x5 letters, 1px apart. Returns the width. */
export function micro(p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = MICRO[ch] ?? MICRO[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') p.rect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale, col);
    cx += 4 * scale;
  }
  return cx - x - scale;
}

export const microWidth = (s: string, scale = 1) => Math.max(0, s.length * 4 * scale - scale);

/** Micro text centered on cx. */
export function microC(p: Pixels, cx: number, y: number, s: string, col: number, scale = 1): void {
  micro(p, Math.round(cx - microWidth(s, scale) / 2), y, s, col, scale);
}

/** ASCII art: each character maps to a color through `key`; others are skipped. */
export function art(p: Pixels, x: number, y: number, rows: string[], key: Record<string, number>): Pixels {
  rows.forEach((row, yy) => [...row].forEach((ch, xx) => ch in key && p.set(x + xx, y + yy, key[ch])));
  return p;
}

/** Scales a picture up by an integer factor (nearest neighbor), skipping `transparent`. */
export function scaleBlit(dst: Pixels, src: Pixels, dx: number, dy: number, k: number, transparent = CLEAR): void {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const v = src.px[y * src.w + x];
      if (v !== transparent) dst.rect(dx + x * k, dy + y * k, k, k, v);
    }
}
