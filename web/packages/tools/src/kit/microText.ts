// Shared 3×5 text drawing with selectable glyph coverage, spacing, and optional custom artwork.
import { MICRO_GLYPHS, type MicroGlyphs } from '../microFont';
import { Pixels } from './pixels';
import { textInk } from './textBounds';
export interface MicroTextOptions {
  glyphs?: MicroGlyphs;
  fallback?: string;
  /** Include the final one-pixel spacer in the returned advance. */
  trailingGap?: boolean;
  /** Match a glyph before uppercasing it (for symbols such as µ). */
  glyphCase?: boolean;
  /** Consumer-owned multicolor glyphs; clear pixels are 255. */
  custom?: (character: string) => Pixels | undefined;
}
export function createMicroText(options: MicroTextOptions = {}) {
  const { glyphs = MICRO_GLYPHS, fallback = '?', trailingGap = false, glyphCase = true, custom } = options;
  if (!(fallback in glyphs)) throw new RangeError('Micro font must contain its fallback glyph');
  return (p: Pixels, x: number, y: number, s: string, col: number, scale = 1): number => {
    const ink = textInk(p, s, undefined, (ch) => ch in glyphs || ch.toUpperCase() in glyphs || !!custom?.(ch));
    const dot = (dx: number, dy: number, color = col) => {
      p.rect(dx, dy, scale, scale, color);
      ink?.add(dx, dy, scale, scale);
    };
    let cx = x;
    for (const ch of glyphCase ? s : s.toUpperCase()) {
      const picture = custom?.(ch);
      if (picture) {
        for (let yy = 0; yy < picture.h; yy++)
          for (let xx = 0; xx < picture.w; xx++) {
            const c = picture.get(xx, yy);
            if (c !== 255) dot(cx + xx * scale, y + yy * scale, c);
          }
        cx += (picture.w + 1) * scale;
      } else {
        const g = (glyphCase ? (glyphs[ch] ?? glyphs[ch.toUpperCase()]) : glyphs[ch]) ?? glyphs[fallback];
        for (let i = 0; i < 15; i++) if (g[i] === '1') dot(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale);
        cx += 4 * scale;
      }
    }
    ink?.end();
    return cx - x - (trailingGap ? 0 : scale);
  };
}
/** Legacy cell advance with the final spacer omitted (including the historical empty-string value). */
export const microAdvance = (s: string, scale = 1) => s.length * 4 * scale - scale;
/** Visible-cell width; empty strings have no ink. */
export const microWidth = (s: string, scale = 1) => Math.max(0, microAdvance(s, scale));
export const micro = createMicroText();
