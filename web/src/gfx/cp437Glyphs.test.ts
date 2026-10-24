// FONT_CP437 has a real glyph for every code page 437 character.
import { describe, expect, it } from 'vitest';
import { FONT_CP437 } from './cp437Glyphs';
import { FONT8X8 } from './font8x8';

const glyph = (c: number) => [...FONT_CP437.subarray(c * 8, c * 8 + 8)];
const BOX = [0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x00];

describe('FONT_CP437', () => {
  it('draws every code 1-255, none as the missing-glyph box', () => {
    for (let c = 1; c < 256; c++) {
      expect(glyph(c), `code ${c}`).not.toEqual(BOX);
      // Only the space and the no-break space are blank.
      if (c !== 32 && c !== 255) expect(glyph(c).some(Boolean), `code ${c}`).toBe(true);
    }
  });

  it('leaves NUL and the no-break space blank', () => {
    expect(glyph(0).some(Boolean)).toBe(false);
    expect(glyph(255).some(Boolean)).toBe(false);
  });

  it('keeps font8x8_basic for printable ASCII', () => {
    expect(FONT_CP437.subarray(32 * 8, 127 * 8)).toEqual(FONT8X8.subarray(32 * 8, 127 * 8));
  });

  it('gives distinct glyphs to distinct characters', () => {
    const seen = new Map<string, number>();
    for (let c = 1; c < 255; c++) {
      if (c === 32) continue;
      const key = glyph(c).join(',');
      expect(seen.get(key), `code ${c}`).toBeUndefined();
      seen.set(key, c);
    }
  });
});
