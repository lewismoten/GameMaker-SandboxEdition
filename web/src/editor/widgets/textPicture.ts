// Display_File's first page: the engine's 31-character lines and BIOS glyphs, without a DOM.
// Glyph data comes from the tools package's credited CP437 font; the engine skips bytes >= 128.
import { glyphRows } from '@lewismoten/gamemaker-sandbox-tools/text';
import { textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { STOCK_LOOK } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

/** Standalone text has a blank background; a slide list may put the same text over an image. */
export function textPicture(bytes: Uint8Array, palette: Palette): Uint8Array {
  const pixels = new Uint8Array(320 * 200);
  const ink = STOCK_LOOK.color(palette, 'color.select.textPages');
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
