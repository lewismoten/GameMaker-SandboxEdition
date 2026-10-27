// Drawing helpers for blocks, sprites and screens: dithered shading, bevelled boxes,
// ASCII sprites, the PC's 8x8 font (at any scale) and a 3x5 font for silkscreen labels.
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { Pixels } from '../../../kit/pixels';
import { textInk } from '../../../kit/textBounds';
export { shadeAt, gradient, blob, bevel } from '../../../kit/shading';

export const CLEAR = 255;

/** Adds a 1 pixel outline in `ink` around every opaque pixel. */
export function outline(src: Pixels, ink: number): Pixels {
  const p = new Pixels(src.w, src.h, CLEAR);
  p.px.set(src.px);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      if (src.get(x, y) !== CLEAR) continue;
      const n = [src.get(x - 1, y), src.get(x + 1, y), src.get(x, y - 1), src.get(x, y + 1)];
      if (n.some((v) => v !== CLEAR && v !== -1)) p.set(x, y, ink);
    }
  return p;
}

/** Text in the PC font; returns the width drawn. */
export function text(p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number {
  const ink = textInk(p, s);
  const dot = (dx: number, dy: number, dw: number, dh: number) => {
    p.rect(dx, dy, dw, dh, col);
    ink?.add(dx, dy, dw, dh);
  };
  [...s].forEach((ch, i) => {
    const g = ch.charCodeAt(0) & 255;
    for (let row = 0; row < 8; row++) {
      const bits = FONT8X8[g * 8 + row];
      for (let b = 0; b < 8; b++) if (bits & (1 << b)) dot(x + (i * 8 + b) * scale, y + row * scale, scale, scale);
    }
  });
  ink?.end();
  return s.length * 8 * scale;
}

export const textWidth = (s: string, scale = 1) => s.length * 8 * scale;

/** Text with an outline (and an optional drop shadow). */
export function outlined(p: Pixels, x: number, y: number, s: string, col: number, edge: number, scale = 1, shadow?: number): void {
  if (shadow !== undefined)
    for (const [dx, dy] of [
      [2, 2],
      [1, 2],
      [2, 1],
    ])
      text(p, x + dx * scale, y + dy * scale, s, shadow, scale);
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ])
    text(p, x + dx, y + dy, s, edge, scale);
  text(p, x, y, s, col, scale);
}

/** Centered text (outlined when `edge` is given). */
export function centered(p: Pixels, y: number, s: string, col: number, scale = 1, edge?: number, cx = p.w / 2, shadow?: number): void {
  const x = Math.round(cx - textWidth(s, scale) / 2);
  if (edge === undefined) text(p, x, y, s, col, scale);
  else outlined(p, x, y, s, col, edge, scale, shadow);
}

// A 3x5 font for silkscreen labels on the boards (R1, C4, U2, +5V...).
const MICRO: Record<string, string> = {
  A: '010101111101101',
  B: '110101110101110',
  C: '111100100100111',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '111100101101111',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101111',
  K: '101101110101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '111101101101111',
  P: '111101111100100',
  Q: '111101101111001',
  R: '110101110101101',
  S: '111100111001111',
  T: '111010010010010',
  U: '101101101101111',
  V: '101101101101010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '111001111100111',
  '3': '111001111001111',
  '4': '101101111001001',
  '5': '111100111001111',
  '6': '111100111101111',
  '7': '111001001010010',
  '8': '111101111101111',
  '9': '111101111001111',
  '+': '000010111010000',
  '-': '000000111000000',
  '.': '000000000000010',
  '/': '001001010100100',
  ':': '000010000010000',
  ' ': '000000000000000',
  '(': '010100100100010',
  ')': '010001001001010',
  ',': '000000000010100',
  '&': '010101010101011',
  '#': '101111101111101',
  $: '011110010011110',
  '%': '101001010100101',
  '*': '000101010101000',
  '@': '010101111100011',
  '!': '010010010000010',
  '?': '111001011000010',
  "'": '010010000000000',
  '=': '000111000111000',
  '>': '100010001010100',
  '<': '001010100010001',
  '~': '000011110000000',
};

export function micro(p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number {
  const ink = textInk(p, s, undefined, (ch) => ch in MICRO || ch.toUpperCase() in MICRO);
  const dot = (dx: number, dy: number, dw: number, dh: number) => {
    p.rect(dx, dy, dw, dh, col);
    ink?.add(dx, dy, dw, dh);
  };
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = MICRO[ch] ?? MICRO['?'];
    for (let i = 0; i < 15; i++) if (g[i] === '1') dot(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale);
    cx += 4 * scale;
  }
  ink?.end();
  return cx - x;
}

/** Nearest-neighbor scaled copy (for big sprites on screens). */
export function scaleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false): void {
  for (let yy = 0; yy < src.h; yy++)
    for (let xx = 0; xx < src.w; xx++) {
      const v = src.get(flip ? src.w - 1 - xx : xx, yy);
      if (v !== CLEAR && v >= 0) dst.rect(x + xx * s, y + yy * s, s, s, v);
    }
}
