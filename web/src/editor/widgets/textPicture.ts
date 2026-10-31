// Display_File's first page: the engine's 31-character lines and BIOS glyphs, without a DOM.
// Glyph data comes from the tools package's credited CP437 font; the engine skips bytes >= 128.
import { glyphRows } from '@lewismoten/gamemaker-sandbox-tools/text';
import { textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { vga8, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

function luminance(palette: Palette, i: number): number {
  const [r, g, b] = [0, 1, 2].map((k) => {
    const c = vga8(palette[i * 3 + k]) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** White on black, for a palette with nothing readable on its background. */
const WHITE_ON_BLACK = (() => {
  const p = new Uint8Array(768);
  p.set([63, 63, 63], 3);
  return p;
})();

/**
 * The thumbnail's text colors. The ink is the palette color nearest the player's text-pages
 * color (`preferred`, 0..63 levels; the stock purple) that reads against color 0 at 3:1 or
 * better; with none, white on black. Thumbnails only: the game and exports are unchanged.
 */
export function textColors(palette: Palette, preferred: readonly number[] = [50, 10, 50]): { palette: Palette; ink: number } {
  const bg = luminance(palette, 0);
  let best = -1;
  let bestDistance = Infinity;
  for (let i = 1; i < 256; i++) {
    if (contrast(luminance(palette, i), bg) < 3) continue;
    const d = [0, 1, 2].reduce((t, k) => t + (palette[i * 3 + k] - preferred[k]) ** 2, 0);
    if (d < bestDistance) [best, bestDistance] = [i, d];
  }
  return best < 0 ? { palette: WHITE_ON_BLACK, ink: 1 } : { palette, ink: best };
}

/** Standalone text has a blank background; a slide list may put the same text over an image. */
export function textPicture(bytes: Uint8Array, ink: number): Uint8Array {
  const pixels = new Uint8Array(320 * 200);
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
