// Legacy 8×8 font drawing with reusable effects and optional consumer-owned glyph artwork.
import { Pixels } from './pixels';
import { textInk } from './textBounds';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
export interface PcTextOptions {
  custom?: (character: string, color: number, flat: boolean) => Pixels | undefined;
  shadowOffsets?: readonly (readonly [number, number])[];
  /** Absolute output-pixel offsets, when spacing is not proportional to glyph scale. */
  shadowPixels?: (scale: number) => readonly (readonly [number, number])[];
  outlineDistance?: (scale: number) => number;
  /** Some older consumers measure code points rather than UTF-16 units. */
  codePointWidth?: boolean;
  /** Treat palette index zero as a valid shadow (default true). */
  shadowZero?: boolean;
}
export const textWidth = (s: string, scale = 1) => s.length * 8 * scale;
export function createPcText(options: PcTextOptions = {}) {
  const {
    custom,
    shadowPixels,
    shadowOffsets = [
      [2, 2],
      [1, 2],
      [2, 1],
    ],
    outlineDistance = () => 1,
    codePointWidth = false,
    shadowZero = true,
  } = options;
  function text(p: Pixels, x: number, y: number, s: string, col: number, scale = 1, flat = false): number {
    const ink = textInk(p, s);
    const dot = (dx: number, dy: number, color = col) => {
      p.rect(dx, dy, scale, scale, color);
      ink?.add(dx, dy, scale, scale);
    };
    let cx = x;
    for (const ch of s) {
      const glyph = custom?.(ch, col, flat);
      if (glyph) {
        for (let row = 0; row < glyph.h; row++)
          for (let b = 0; b < glyph.w; b++) {
            const color = glyph.get(b, row);
            if (color !== 255) dot(cx + b * scale, y + row * scale, color);
          }
      } else {
        const base = (ch.charCodeAt(0) & 255) * 8;
        for (let row = 0; row < 8; row++) {
          const bits = FONT8X8[base + row];
          for (let b = 0; b < 8; b++) if (bits & (1 << b)) dot(cx + b * scale, y + row * scale);
        }
      }
      cx += 8 * scale;
    }
    ink?.end();
    return codePointWidth ? cx - x : textWidth(s, scale);
  }
  function outlined(p: Pixels, x: number, y: number, s: string, col: number, edge: number, scale = 1, shadow?: number): void {
    if (shadow !== undefined && (shadowZero || shadow !== 0))
      for (const [dx, dy] of shadowPixels?.(scale) ?? shadowOffsets.map(([dx, dy]) => [dx * scale, dy * scale]))
        text(p, x + dx, y + dy, s, shadow, scale, true);
    const step = outlineDistance(scale);
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
      text(p, x + dx * step, y + dy * step, s, edge, scale, true);
    text(p, x, y, s, col, scale);
  }
  function centered(p: Pixels, y: number, s: string, col: number, scale = 1, edge?: number, cx = p.w / 2, shadow?: number): void {
    const x = Math.round(cx - textWidth(s, scale) / 2);
    if (edge === undefined) text(p, x, y, s, col, scale);
    else outlined(p, x, y, s, col, edge, scale, shadow);
  }
  return { text, outlined, centered };
}
export const { text, outlined, centered } = createPcText();
