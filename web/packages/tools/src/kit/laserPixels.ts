// Pixel art and pixel text as engrave shapes for the laser (laserSvg.ts): runs of lit pixels merge into rectangles
// (a row run, then identical runs of the rows below join it), so a figure or a line of text stays a few dozen paths.
// Text is drawn from the engine's 8x8 PC font (public domain font8x8) or the project's 3x5 micro font, set on a straight
// line or round an arc, so no outline font is needed.
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { MICRO_GLYPHS } from '../microFont';
import { LaserSheet, type Pt } from './laserSvg';

export type Rect = readonly [x: number, y: number, w: number, h: number];
export interface Bitmap {
  w: number;
  h: number;
  on: (x: number, y: number) => boolean;
}
export type FontName = 'pc' | 'micro';
/** Pixels across and down a capital letter, and the step from one letter to the next, in each font. */
export const FONTS = { pc: { cap: 7, adv: 8, gw: 7 }, micro: { cap: 5, adv: 4, gw: 3 } } as const;

/** Lit pixels as rectangles: a row's runs, joined by identical runs on the rows below. */
export function mergeRuns(b: Bitmap): Rect[] {
  const out: Rect[] = [];
  let open = new Map<string, number>();
  for (let y = 0; y < b.h; y++) {
    const next = new Map<string, number>();
    for (let x = 0; x < b.w;) {
      if (!b.on(x, y)) {
        x++;
        continue;
      }
      let e = x;
      while (e < b.w && b.on(e, y)) e++;
      const key = `${x},${e - x}`;
      const at = open.get(key);
      if (at !== undefined) {
        const r = out[at];
        out[at] = [r[0], r[1], r[2], r[3] + 1];
        next.set(key, at);
      } else {
        out.push([x, y, e - x, 1]);
        next.set(key, out.length - 1);
      }
      x = e;
    }
    open = next;
  }
  return out;
}

/** Engrave every rectangle, its corners mapped from pixel space to millimeters by `map`. */
export function engraveRects(sheet: LaserSheet, rects: Rect[], map: (x: number, y: number) => Pt): void {
  for (const [x, y, w, h] of rects) sheet.add({ op: 'engrave', k: 'poly', pts: [map(x, y), map(x + w, y), map(x + w, y + h), map(x, y + h)] });
}

const glyph = (font: FontName, ch: string): Bitmap => {
  const { cap, adv } = FONTS[font];
  if (font === 'pc') {
    const c = ch.charCodeAt(0);
    return { w: adv, h: cap, on: (x, y) => c < 128 && ((FONT8X8[c * 8 + y] >> x) & 1) === 1 };
  }
  const g = MICRO_GLYPHS[ch];
  return { w: adv, h: cap, on: (x, y) => x < 3 && !!g && g[y * 3 + x] === '1' };
};
/** Only what a font can draw, in capitals (anything else is dropped, so a name never throws). */
export const drawable = (font: FontName, s: string) =>
  [...s.toUpperCase()].filter((c) => c === ' ' || (font === 'micro' ? c in MICRO_GLYPHS : c.charCodeAt(0) > 32 && c.charCodeAt(0) < 127)).join('');

/** The width of `s` in pixels (the last letter's trailing gap left out). */
export const textPixels = (font: FontName, s: string) => (s.length ? (s.length - 1) * FONTS[font].adv + FONTS[font].gw : 0);

/** One line of text, centered on (cx, cy), each pixel `px` mm. Returns the text's width and height in mm. */
export function lineText(sheet: LaserSheet, s: string, font: FontName, cx: number, cy: number, px: number): { w: number; h: number } {
  const t = drawable(font, s);
  const { cap, adv } = FONTS[font];
  const w = textPixels(font, t);
  const rects: Rect[] = [];
  [...t].forEach((ch, i) => {
    if (ch === ' ') return;
    for (const [x, y, rw, rh] of mergeRuns(glyph(font, ch))) rects.push([x + i * adv, y, rw, rh]);
  });
  engraveRects(sheet, rects, (x, y) => [cx + (x - w / 2) * px, cy + (y - cap / 2) * px]);
  return { w: w * px, h: cap * px };
}

/**
 * Text set round a circle about (cx, cy): `top` reads left to right over the top with its feet at radius `r`; otherwise
 * it runs along the bottom, left to right, with its feet at the outer radius `r` and its heads toward the middle.
 * Each pixel is `px` mm. Returns the angle the line spans in degrees.
 */
export function arcText(sheet: LaserSheet, s: string, font: FontName, cx: number, cy: number, r: number, px: number, top: boolean): number {
  const t = drawable(font, s);
  const { cap, adv, gw } = FONTS[font];
  const sgn = top ? 1 : -1;
  const mid = r + (sgn * cap * px) / 2;
  const step = (adv * px) / mid;
  [...t].forEach((ch, i) => {
    if (ch === ' ') return;
    const th = (top ? Math.PI / 2 : (3 * Math.PI) / 2) + (top ? -1 : 1) * (i - (t.length - 1) / 2) * step;
    const er = [Math.cos(th), -Math.sin(th)];
    const tg = [(top ? -1 : 1) * -Math.sin(th), (top ? -1 : 1) * -Math.cos(th)];
    engraveRects(sheet, mergeRuns(glyph(font, ch)), (x, y) => {
      const rho = r + sgn * (cap - y) * px;
      const u = (x - gw / 2) * px;
      return [cx + rho * er[0] + u * tg[0], cy + rho * er[1] + u * tg[1]];
    });
  });
  return (((t.length - 1) * step + (gw * px) / mid) * 180) / Math.PI;
}

export type Rgb = readonly [number, number, number];

/** Skin and other warm light colors (orange-ish hue, fairly light) stay bare wood. */
const skinLike = (r: number, g: number, b: number, l: number) =>
  l > 0.42 && r > g && g > b && r - b > 0.12 && (g - b) / (r - b + 1e-6) > 0.2 && (g - b) / (r - b + 1e-6) < 0.85;

/**
 * A picture engraved by tone from its own colors (0 to 1 per channel; `rgb` gives undefined where clear): dark colors solid,
 * mid colors (clothes, hair, hats) as a checker or lines coarse enough to read at coin size, skin and very light colors left
 * as wood. Every edge pixel stays solid, and so does a mid pixel that touches skin or light wood, so collars, sleeves, belts
 * and hems read as outlines and a figure never looks bare.
 */
export function toneBitmap(w: number, h: number, rgb: (x: number, y: number) => Rgb | undefined): Bitmap {
  const lum = (x: number, y: number) => {
    const c = x >= 0 && y >= 0 && x < w && y < h ? rgb(x, y) : undefined;
    return c ? 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2] : -1;
  };
  // 0 clear, 1 wood (light or skin), 2 light mid, 3 dark mid, 4 solid
  const tone = (x: number, y: number) => {
    const c = x >= 0 && y >= 0 && x < w && y < h ? rgb(x, y) : undefined;
    if (!c) return 0;
    const l = lum(x, y);
    if (l < 0.3) return 4;
    if (l > 0.68 || skinLike(c[0], c[1], c[2], l)) return 1;
    return l < 0.46 ? 3 : 2;
  };
  return {
    w,
    h,
    on: (x, y) => {
      const t = tone(x, y);
      if (t === 0) return false;
      const n = [tone(x - 1, y), tone(x + 1, y), tone(x, y - 1), tone(x, y + 1)];
      if (t === 4 || n.includes(0)) return true;
      if (t === 1) return false;
      if (n.includes(1)) return true;
      return t === 3 ? (x + y) % 2 === 0 : y % 2 === 0;
    },
  };
}

/** The angle in degrees `s` would span round a circle: what arcText returns, without drawing. */
export function arcSpanDeg(s: string, font: FontName, r: number, px: number, top: boolean): number {
  const { cap, adv, gw } = FONTS[font];
  const t = drawable(font, s);
  const mid = r + ((top ? 1 : -1) * cap * px) / 2;
  return ((((t.length - 1) * adv + gw) * px) / mid) * (180 / Math.PI);
}

/** The columns and rows holding lit pixels: [x0, y0, x1, y1] (end exclusive), or undefined when none. */
export function inkBox(b: Bitmap): [number, number, number, number] | undefined {
  let x0 = b.w;
  let y0 = b.h;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < b.h; y++)
    for (let x = 0; x < b.w; x++)
      if (b.on(x, y)) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x + 1);
        y1 = Math.max(y1, y + 1);
      }
  return x1 > x0 ? [x0, y0, x1, y1] : undefined;
}
