// Display_File's first page: the engine's 31-character lines and BIOS glyphs, without a DOM.
// Glyph data comes from the tools package's credited CP437 font; the engine skips bytes >= 128.
import { glyphRows } from '@lewismoten/gamemaker-sandbox-tools/text';
import { textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { matchColor, vga8, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

function luminance(palette: Palette, i: number): number {
  const [r, g, b] = [0, 1, 2].map((k) => vga8(palette[i * 3 + k]) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The stock purple, unless it would vanish against the background: then the palette's lightest or darkest match. Thumbnails only. */
export function textInk(palette: Palette): number {
  const purple = matchColor(palette, 50, 10, 50);
  const bg = luminance(palette, 0);
  const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  if (ratio(luminance(palette, purple), bg) >= 3) return purple;
  return bg < 0.4 ? matchColor(palette, 63, 63, 63) : matchColor(palette, 0, 0, 0);
}

/** Standalone text has a blank background; a slide list may put the same text over an image. */
export function textPicture(bytes: Uint8Array, palette: Palette): Uint8Array {
  const pixels = new Uint8Array(320 * 200);
  // ShowGraphic's stock purple selector (see textInk); keep the full runtime out of editor thumbnails.
  const ink = textInk(palette);
  textLines(bytes)
    .slice(0, 16)
    .forEach((line, row) => {
      for (let column = 0; column < line.length; column++) {
        const code = line.charCodeAt(column);
        if (code >= 128) continue;
        const glyph = glyphRows(code);
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (glyph[y] & (1 << x)) pixels[(40 + row * 8 + y) * 320 + 40 + column * 8 + x] = ink;
      }
    });
  return pixels;
}
