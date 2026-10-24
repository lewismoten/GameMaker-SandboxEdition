// Lettering for screens and signs: the PC's 8x8 font (scaled, outlined) and a 3x5 font
// small enough to paint "PHONE" across one 20x20 block.
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import type { Pixels } from '../../../kit/pixels';
import { textInk } from '../../../kit/textBounds';

/** Draws 8x8 text; `scale` makes chunky letters. Returns the width drawn. */
export function text(p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number {
  const ink = textInk(p, s);
  const dot = (dx: number, dy: number, dw: number, dh: number) => {
    p.rect(dx, dy, dw, dh, col);
    ink?.add(dx, dy, dw, dh);
  };
  let cx = x;
  for (const ch of s) {
    const base = (ch.charCodeAt(0) & 0xff) * 8;
    for (let row = 0; row < 8; row++) {
      const bits = FONT8X8[base + row];
      for (let b = 0; b < 8; b++) if (bits & (1 << b)) dot(cx + b * scale, y + row * scale, scale, scale);
    }
    cx += 8 * scale;
  }
  ink?.end();
  return cx - x;
}

export const textWidth = (s: string, scale = 1) => s.length * 8 * scale;

/** Text with a 1px (scaled) outline or drop shadow. */
export function outlined(p: Pixels, x: number, y: number, s: string, col: number, outline: number, scale = 1, shadow?: number): void {
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
    text(p, x + dx, y + dy, s, outline, scale);
  text(p, x, y, s, col, scale);
}

export function centered(p: Pixels, y: number, s: string, col: number, scale = 1, outline?: number): void {
  const x = Math.round((p.w - textWidth(s, scale)) / 2);
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
  '(': '010100100100010',
  ')': '010001001001010',
  '¢': '010111100111010',
  '+': '000010111010000',
  '=': '000111000111000',
  '*': '101010101000000',
};

/** 3x5 letters, 1px apart. */
export function micro(p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number {
  const ink = textInk(p, s, undefined, (ch) => ch in MICRO || ch.toUpperCase() in MICRO);
  const dot = (dx: number, dy: number, dw: number, dh: number) => {
    p.rect(dx, dy, dw, dh, col);
    ink?.add(dx, dy, dw, dh);
  };
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = MICRO[ch] ?? MICRO[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') dot(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale);
    cx += 4 * scale;
  }
  ink?.end();
  return cx - x - scale;
}

export const microWidth = (s: string, scale = 1) => s.length * 4 * scale - scale;
