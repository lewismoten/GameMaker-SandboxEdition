// Indexed text images for native blocks and pictures; CP437 credits are in NOTICE.md.
import { FONT_CP437 } from '@lewismoten/gamemaker-sandbox-engine/gfx/cp437Glyphs';
import { toCp437, fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { Pixels } from './kit/pixels';
import { MICRO_GLYPHS } from './microFont';

export { FONT_CP437, toCp437, fromCp437, MICRO_GLYPHS };
export type TextFont = 'cp437' | 'micro';

/** Encode Unicode DOS symbols, including box drawing. Unsupported characters throw. */
export function encodeText(s: string): Uint8Array {
  for (const ch of s) {
    if (ch.charCodeAt(0) >= 128 && toCp437(ch) === ch && fromCp437(ch) !== ch) throw new RangeError(`No CP437 glyph for ${ch}`);
  }
  const encoded = toCp437(s);
  const bytes = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    const code = encoded.charCodeAt(i);
    if (code > 255) throw new RangeError(`No CP437 glyph for ${encoded[i]}`);
    bytes[i] = code;
  }
  return bytes;
}

/** A fresh copy of a glyph's rows; bit 0 is the leftmost pixel. */
export function glyphRows(code: number, font: TextFont = 'cp437'): Uint8Array {
  if (!Number.isInteger(code) || code < 0 || code > 255) throw new RangeError('Glyph code must be 0..255');
  if (font === 'cp437') return FONT_CP437.slice(code * 8, code * 8 + 8);
  const glyph = MICRO_GLYPHS[fromCp437(String.fromCharCode(code)).toUpperCase()] ?? MICRO_GLYPHS['?'];
  return Uint8Array.from({ length: 5 }, (_, y) => {
    let row = 0;
    for (let x = 0; x < 3; x++) if (glyph[y * 3 + x] === '1') row |= 1 << x;
    return row;
  });
}

export interface TextOptions {
  font?: TextFont;
  /** Palette index, 0..254; 255 is reserved for transparent pixels. */
  color?: number;
  scale?: number;
  /** A one-output-pixel outline, including diagonal neighbors. */
  outline?: number;
  /** Shadow offset in output pixels, independent of glyph scale. */
  shadow?: { color: number; dx?: number; dy?: number };
}

export interface TextImage {
  width: number;
  height: number;
  /** Row-major palette indexes; transparent pixels are 255. */
  pixels: Uint8Array;
  /** Where the unadorned first text cell begins within the image. */
  originX: number;
  originY: number;
}

/** Same-size shadowed sprite; pixels beyond the source canvas are clipped. */
export function dropShadow(src: Pixels, ink: number, dx = 1, dy = 2): Pixels {
  checkInk(ink);
  if (!Number.isInteger(dx) || !Number.isInteger(dy)) throw new RangeError('Shadow offsets must be integers');
  const p = new Pixels(src.w, src.h, 255);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) if (src.get(x, y) !== 255) p.set(x + dx, y + dy, ink);
  return p.blit(src, 0, 0, 255);
}

function checkInk(color: number): void {
  if (!Number.isInteger(color) || color < 0 || color > 254) throw new RangeError('Ink must be a palette index 0..254');
}

/**
 * Render Unicode text (LF/CRLF separated lines) or raw CP437 bytes (one row, including
 * control-code glyphs). Returns native indexed pixels, with enough padding for effects.
 * CP437 cells are 8×8; micro cells are 3×5 plus a 1px gap, with no trailing gap.
 */
export function renderText(text: string | Uint8Array, options: TextOptions = {}): TextImage {
  const { font = 'cp437', color = 0, scale = 1, outline, shadow } = options;
  checkInk(color);
  if (outline !== undefined) checkInk(outline);
  if (shadow) checkInk(shadow.color);
  if (!Number.isSafeInteger(scale) || scale < 1) throw new RangeError('Scale must be a positive integer');
  const dx = shadow?.dx ?? 1,
    dy = shadow?.dy ?? 2;
  if (!Number.isSafeInteger(dx) || !Number.isSafeInteger(dy)) throw new RangeError('Shadow offsets must be integers');
  const lines = typeof text === 'string' ? text.replaceAll('\r\n', '\n').split('\n').map(encodeText) : [text];
  const columns = Math.max(...lines.map((line) => line.length));
  if (!columns) return { width: 0, height: 0, pixels: new Uint8Array(), originX: 0, originY: 0 };
  const glyphW = font === 'cp437' ? 8 : 3,
    glyphH = font === 'cp437' ? 8 : 5;
  const advance = font === 'cp437' ? 8 : 4;
  const edge = outline === undefined ? 0 : 1;
  const left = Math.min(-edge, shadow ? dx : 0),
    top = Math.min(-edge, shadow ? dy : 0);
  const right = Math.max(edge, shadow ? dx : 0),
    bottom = Math.max(edge, shadow ? dy : 0);
  const width = ((columns - 1) * advance + glyphW) * scale + right - left;
  const height = ((lines.length - 1) * (glyphH + 1) + glyphH) * scale + bottom - top;
  const mask = new Pixels(width, height, 255);
  lines.forEach((line, lineY) =>
    line.forEach((code, cellX) => {
      glyphRows(code, font).forEach((row, y) => {
        for (let x = 0; x < glyphW; x++)
          if (row & (1 << x)) mask.rect((cellX * advance + x) * scale - left, (lineY * (glyphH + 1) + y) * scale - top, scale, scale, color);
      });
    }),
  );
  const p = new Pixels(width, height, 255);
  if (shadow) p.blit(dropShadow(mask, shadow.color, dx, dy), 0, 0, 255);
  if (outline !== undefined) {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (mask.get(x, y) !== 255) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) p.set(x + ox, y + oy, outline);
  }
  p.blit(mask, 0, 0, 255);
  return { width, height, pixels: p.px, originX: -left, originY: -top };
}
