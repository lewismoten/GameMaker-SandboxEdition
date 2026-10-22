// 320x200 pictures (title, menu, story pages, portraits behind the talk, the ending) painted in
// true color and saved as 256-color GIFs with their own median-cut palette. Game-Maker writes
// its own words over some of them in whatever palette entry is nearest pure purple (text pages),
// blue (the menu) or red ("MORE..."), so each picture reserves an ink for those and keeps every
// other color farther away from them than the ink.
import { encodeGif } from '../../../../web/src/formats/gif';
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { medianCutPalette } from '../../../kit/quantize';
import { Canvas, type RGB, mix } from '../art/rgb';

/** Game-Maker's RGBPurple/RGBBlue/RGBRed (6-bit). */
const PURPLE: RGB = [50, 10, 50];
const BLUE: RGB = [10, 10, 63];
const RED: RGB = [63, 10, 10];

export interface Inks {
  /** What Game-Maker's text pages print in (nearest to purple). */
  text?: RGB;
  /** The menu's words (nearest to blue). */
  menu?: RGB;
  /** "MORE..." (nearest to red). */
  more?: RGB;
}

/** 8-bit RGB to the 6-bit value the palette will hold. */
const six = (c: RGB): RGB => c.map((v) => Math.max(0, Math.min(63, Math.round(v / 4.048)))) as RGB;
const d2 = (a: RGB, b: RGB) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

export class Screen {
  readonly cv: Canvas;
  constructor(
    readonly w = 320,
    readonly h = 200,
  ) {
    this.cv = new Canvas(w, h);
  }

  /** Text in the PC's 8x8 font, scaled with rounded, antialiased pixels; returns the width. */
  text(x: number, y: number, s: string, col: RGB | ((x: number, y: number) => RGB), scale = 1, shadow?: RGB): number {
    if (shadow) this.glyphs(x + Math.max(1, scale * 0.6), y + Math.max(1, scale * 0.8), s, shadow, scale);
    return this.glyphs(x, y, s, col, scale);
  }

  private glyphs(x: number, y: number, s: string, col: RGB | ((x: number, y: number) => RGB), scale: number): number {
    let cx = x;
    for (const ch of s) {
      const base = (ch.charCodeAt(0) & 0xff) * 8;
      const on = (r: number, b: number) => r >= 0 && r < 8 && b >= 0 && b < 8 && (FONT8X8[base + r] >> b) & 1;
      if (scale === 1) {
        for (let r = 0; r < 8; r++) for (let b = 0; b < 8; b++) if (on(r, b)) this.cv.set(cx + b, y + r, typeof col === 'function' ? col(cx + b, y + r) : col);
      } else {
        const gx = cx;
        this.cv.fillSdf(
          (px, py) => {
            const u = (px - gx) / scale;
            const v = (py - y) / scale;
            const b = Math.floor(u);
            const r = Math.floor(v);
            if (u < -0.5 || v < -0.5 || u > 8.5 || v > 8.5) return 2;
            // a lit cell, or a corner bridged diagonally between two lit cells, is ink
            if (on(r, b)) return -1;
            const fu = u - b;
            const fv = v - r;
            const dx = fu < 0.5 ? -1 : 1;
            const dy = fv < 0.5 ? -1 : 1;
            if (on(r, b + dx) && on(r + dy, b) && Math.abs(fu - 0.5) + Math.abs(fv - 0.5) > 0.5) return -1;
            return 1;
          },
          col,
          3,
        );
      }
      cx += 8 * scale;
    }
    return cx - x;
  }

  centered(y: number, s: string, col: RGB | ((x: number, y: number) => RGB), scale = 1, shadow?: RGB): void {
    this.text(Math.round((this.w - s.length * 8 * scale) / 2), y, s, col, scale, shadow);
  }

  /** The picture as 256 colors: the inks reserved, the rest by median cut; returns pixels and palette. */
  indexed(inks: Inks = {}, dither = 6): { pixels: Uint8Array; palette: Uint8Array } {
    const fixed: RGB[] = [[0, 0, 0]];
    const want: [RGB, RGB][] = [];
    if (inks.text) want.push([inks.text, PURPLE]);
    if (inks.menu) want.push([inks.menu, BLUE]);
    if (inks.more) want.push([inks.more, RED]);
    for (const [c] of want) fixed.push(c);
    const rgb = new Uint8Array(this.w * this.h * 3);
    for (let i = 0; i < this.w * this.h; i++) for (let k = 0; k < 3; k++) rgb[i * 3 + k] = Math.max(0, Math.min(255, Math.round(this.cv.c[i * 3 + k])));
    const pal = medianCutPalette([rgb], fixed as [number, number, number][]);
    // keep every other entry farther from purple/blue/red than its reserved ink
    want.forEach(([, target], k) => {
      const ink = six(fixed[1 + k]);
      const limit = d2(ink, target);
      for (let i = 0; i < 256; i++) {
        if (i === 1 + k) continue;
        let c: RGB = [pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2]];
        let guard = 0;
        while (d2(c, target) <= limit && guard++ < 40) c = c.map((v, j) => Math.max(0, Math.min(63, v + Math.sign(v - target[j] || 1)))) as RGB;
        pal.set(c, i * 3);
      }
    });
    const pixels = new Uint8Array(this.w * this.h);
    const lut = new Map<number, number>();
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        const d = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * dither;
        const c = six([this.cv.c[i * 3] + d, this.cv.c[i * 3 + 1] + d, this.cv.c[i * 3 + 2] + d]);
        const key = (c[0] << 12) | (c[1] << 6) | c[2];
        let v = lut.get(key);
        if (v === undefined) {
          let best = Infinity;
          v = 0;
          for (let p = 0; p < 256; p++) {
            // the reserved inks are only for Game-Maker's own words
            if (p >= 1 && p <= want.length) continue;
            const dd = 3 * (pal[p * 3] - c[0]) ** 2 + 4 * (pal[p * 3 + 1] - c[1]) ** 2 + 2 * (pal[p * 3 + 2] - c[2]) ** 2;
            if (dd < best) {
              best = dd;
              v = p;
            }
          }
          lut.set(key, v);
        }
        pixels[i] = v;
      }
    return { pixels, palette: pal };
  }

  gif(inks: Inks = {}, dither = 6): Uint8Array {
    const { pixels, palette } = this.indexed(inks, dither);
    return encodeGif({ width: this.w, height: this.h, pixels, palette });
  }
}

/** A soft vertical gradient fill. */
export function gradient(cv: Canvas, top: RGB, bottom: RGB, y0 = 0, y1 = cv.h): void {
  cv.shade((_x, y) => mix(top, bottom, Math.max(0, Math.min(1, (y - y0) / (y1 - y0)))));
}
