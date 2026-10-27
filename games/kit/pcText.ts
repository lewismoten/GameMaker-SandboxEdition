// The PC's 8x8 font drawn into the games' pictures at any scale (reporting its ink to the text
// bounds audit, kit/textBounds.ts): plain, outlined with an optional drop shadow, or centered.
import { Pixels } from './pixels';
import { textInk } from './textBounds';
import { FONT8X8 } from '../../web/src/gfx/font8x8';

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
