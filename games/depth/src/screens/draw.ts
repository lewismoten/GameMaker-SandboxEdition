// Lettering and finishing for the 320x200 screens: the PC's 8x8 font drawn into the linear
// RGB picture before it is reduced to 256 colors (so the letters get colors of their own),
// and the reduction itself, into a GIF or a frame.
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { encodeGif } from '../../../../web/src/formats/gif';
import { toBytes, type Picture } from '../render/image';
import { Matcher, medianCut, putColors, type Col } from '../render/quant';
import type { V } from '../render/tracer';

/** Draws text (8x8 font scaled by `s`) in color c, with an optional dark outline and drop shadow. */
export function text(p: Picture, x: number, y: number, str: string, c: V, s = 1, o: { outline?: V; shadow?: V; alpha?: number } = {}): number {
  const plot = (px: number, py: number, col: V, a = 1) => {
    for (let yy = 0; yy < s; yy++)
      for (let xx = 0; xx < s; xx++) {
        const X = px + xx;
        const Y = py + yy;
        if (X < 0 || Y < 0 || X >= p.w || Y >= p.h) continue;
        const i = (Y * p.w + X) * 3;
        for (let ch = 0; ch < 3; ch++) p.rgb[i + ch] = p.rgb[i + ch] * (1 - a) + col[ch] * a;
      }
  };
  const glyph = (cx: number, ch: string, col: V, dx: number, dy: number, a = 1) => {
    const base = (ch.charCodeAt(0) & 0xff) * 8;
    for (let row = 0; row < 8; row++) {
      const bits = FONT8X8[base + row];
      for (let b = 0; b < 8; b++) if (bits & (1 << b)) plot(cx + b * s + dx, y + row * s + dy, col, a);
    }
  };
  let cx = x;
  for (const ch of str) {
    if (o.shadow) glyph(cx, ch, o.shadow, s, s, 0.7);
    if (o.outline)
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
        glyph(cx, ch, o.outline, dx, dy);
    glyph(cx, ch, c, 0, 0, o.alpha ?? 1);
    cx += 8 * s;
  }
  return cx - x;
}

export const textWidth = (s: string, scale = 1) => s.length * 8 * scale;

export function centered(p: Picture, y: number, str: string, c: V, s = 1, o: Parameters<typeof text>[6] = {}): void {
  text(p, Math.round((p.w - textWidth(str, s)) / 2), y, str, c, s, o);
}

/** Darkens (or tints) a rectangle: a smoked-glass panel behind words. */
export function panel(p: Picture, x0: number, y0: number, x1: number, y1: number, tint: V, a: number, edge?: V): void {
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const i = (y * p.w + x) * 3;
      const onEdge = edge && (x === x0 || y === y0 || x === x1 - 1 || y === y1 - 1);
      for (let c = 0; c < 3; c++) p.rgb[i + c] = onEdge ? edge![c] : p.rgb[i + c] * (1 - a) + tint[c] * a;
    }
}

/**
 * The colors PLAYGAME writes with: text pages in the entry nearest (50,10,50), MORE... nearest
 * (63,10,10), the menu nearest (10,10,63). Kept exact in every screen's palette so the words
 * come out in the colors chosen for them.
 */
export const GM_PURPLE: Col = [200, 40, 200];
// a deeper red than (63,10,10) itself, still the nearest entry to it, so MORE... reads at 3:1 on
// the frosted glass (the GIFs' highlights stop short of white)
export const GM_RED: Col = [200, 16, 16];
export const GM_BLUE: Col = [40, 40, 252];
/** Save names are written nearest (63,63,0). */
export const GM_YELLOW: Col = [252, 252, 0];

/**
 * Reduces a picture to a 256-color GIF (error diffusion), with `fixed` colors kept first and
 * `pins` (index, color) kept at their own indices, out of the picture.
 */
export function toGif(p: Picture, fixed: Col[] = [], exposure = 1, pins: [number, Col][] = []): Uint8Array {
  const { pixels, pal } = indexed(p, fixed, exposure, false, pins);
  return encodeGif({ width: p.w, height: p.h, pixels, palette: pal });
}

export function indexed(p: Picture, fixed: Col[] = [], exposure = 1, ordered = false, pins: [number, Col][] = []): { pixels: Uint8Array; pal: Uint8Array } {
  const bytes = toBytes(p, exposure);
  const pal = new Uint8Array(768);
  putColors(pal, 0, fixed);
  const pinned = new Set(pins.map(([i]) => i));
  let at = fixed.length;
  for (const col of medianCut([bytes], 256 - fixed.length - pins.length)) {
    while (pinned.has(at)) at++;
    putColors(pal, at++, [col]);
  }
  for (const [i, col] of pins) putColors(pal, i, [col]);
  // the fixed colors are for lettering PLAYGAME draws; keep them out of the picture
  const m = new Matcher(
    pal,
    Array.from({ length: 256 }, (_, i) => i).filter((i) => i >= fixed.length && !pinned.has(i)),
  );
  const pixels = ordered ? m.ordered(bytes, p.w, p.h, 8) : m.diffuse(bytes, p.w, p.h);
  return { pixels, pal };
}
