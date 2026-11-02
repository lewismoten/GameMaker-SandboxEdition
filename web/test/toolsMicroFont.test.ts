// Extended font data is shared without losing the rounded and square letterforms.
import { expect, it } from 'vitest';
import { MICRO_GLYPHS, MICRO_SQUARE_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { glyphRows, renderText, encodeText } from '@lewismoten/gamemaker-sandbox-tools/drawing';
it('offers the extra sign glyphs without replacing rounded or square letterforms', () => {
  for (const glyph of ['"', '#', 'µ', '¢', '%', '*', '@', '=', '~', '_', '\\']) expect(MICRO_GLYPHS[glyph]).toMatch(/^[01]{15}$/);
  expect(MICRO_GLYPHS.C).toBe('011100100100011');
  expect(MICRO_SQUARE_GLYPHS.C).toBe('111100100100111');
  expect(glyphRows(encodeText('µ')[0], 'micro')).toEqual(Uint8Array.of(0, 5, 5, 7, 1));
  expect(renderText('C', { font: 'micro-square' }).pixels).not.toEqual(renderText('C', { font: 'micro' }).pixels);
});
