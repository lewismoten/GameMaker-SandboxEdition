// Public toolkit font coverage, native text data, effects geometry, and palette fidelity.
import { describe, it, expect } from 'vitest';
import {
  FONT_CP437,
  glyphRows,
  encodeText,
  renderText,
  dropShadow,
  Pixels,
  adjustPalette,
  lightColor,
  colorRamp,
  TIME_OF_DAY_SKY,
  PaletteBuilder,
} from '@lewismoten/gamemaker-sandbox-tools/drawing';

describe('toolkit fonts and indexed text', () => {
  it('provides all DOS glyphs, including controls, shades, and box drawing', () => {
    expect(FONT_CP437.length).toBe(2048);
    const blank = [];
    for (let code = 0; code < 256; code++) {
      const rows = glyphRows(code);
      expect(rows.length).toBe(8);
      if (rows.every((row) => row === 0)) blank.push(code);
    }
    expect(blank).toEqual([0, 32, 255]);
    expect([...glyphRows(219)]).toEqual(Array(8).fill(255));
    expect(encodeText('é♥│█')).toEqual(Uint8Array.of(130, 3, 179, 219));
    expect(() => encodeText('🐶')).toThrow('No CP437 glyph');
    expect(() => encodeText('©')).toThrow('No CP437 glyph');
    const before = glyphRows(65);
    glyphRows(65).fill(0);
    expect(glyphRows(65)).toEqual(before);
  });

  it('separates Unicode line breaks from raw control-code glyphs', () => {
    const multiline = renderText('A\r\nB');
    expect([multiline.width, multiline.height]).toEqual([8, 17]);
    expect(renderText(Uint8Array.of(10)).pixels.some((v) => v !== 255)).toBe(true);
    expect(renderText('◙').pixels).toEqual(renderText(Uint8Array.of(10)).pixels);
    expect(renderText('').pixels.length).toBe(0);
  });

  it('renders the original micro letters and an explicit unknown glyph', () => {
    const a = renderText('a', { font: 'micro', color: 7 });
    expect([a.width, a.height]).toEqual([3, 5]);
    expect([...a.pixels.slice(0, 3)]).toEqual([255, 7, 255]);
    expect(renderText('AB', { font: 'micro' }).width).toBe(7);
    expect(glyphRows(130, 'micro')).toEqual(glyphRows(63, 'micro'));
  });

  it('keeps a text outline one pixel wide at scale three', () => {
    const p = renderText('█', { color: 4, outline: 2, scale: 3 });
    expect([p.width, p.height, p.originX, p.originY]).toEqual([26, 26, 1, 1]);
    for (let y = 0; y < 26; y++) for (let x = 0; x < 26; x++) expect(p.pixels[y * 26 + x]).toBe(x === 0 || y === 0 || x === 25 || y === 25 ? 2 : 4);
  });

  it('pads negative shadows and keeps sprites within their explicit canvas', () => {
    const p = renderText('█', { color: 4, shadow: { color: 8, dx: -2, dy: 3 } });
    expect([p.width, p.height, p.originX, p.originY]).toEqual([10, 11, 2, 0]);
    expect(p.pixels[0]).toBe(255);
    expect(p.pixels[100]).toBe(8);
    expect(p.pixels[2]).toBe(4);
    const src = new Pixels(3, 3, 255).set(1, 1, 4),
      shadow = dropShadow(src, 8, 1, 1);
    expect(shadow.get(2, 2)).toBe(8);
    expect(shadow.get(1, 1)).toBe(4);
    expect(src.get(2, 2)).toBe(255);
    expect(() => renderText('A', { scale: 0 })).toThrow();
    expect(() => renderText('A', { color: 255 })).toThrow();
  });
});

describe('toolkit ramps and palette lighting', () => {
  it('interpolates endpoints and a middle stop before VGA quantization', () => {
    expect(colorRamp(3, [0, 0, 0], [255, 255, 255], [80, 120, 160])).toEqual([
      [0, 0, 0],
      [80, 120, 160],
      [255, 255, 255],
    ]);
    expect(colorRamp(1, [10, 20, 30], [255, 255, 255])).toEqual([[10, 20, 30]]);
    const b = new PaletteBuilder();
    b.ramp('sky', 8, ...TIME_OF_DAY_SKY.sunset);
    expect(b.get('sky')).toHaveLength(8);
    expect(() => colorRamp(0, [0, 0, 0], [1, 1, 1])).toThrow();
  });

  it('lights eight-bit colors and preserves six-bit native palette identities', () => {
    expect(lightColor([100, 100, 100], 'night')).toEqual([54, 58, 108]);
    expect(lightColor([200, 10, 0], { mul: [2, 1, 1], add: [0, -20, 0] })).toEqual([255, 0, 0]);
    const palette = Uint8Array.from({ length: 768 }, (_, i) => i % 64),
      before = palette.slice();
    expect(adjustPalette(palette, 'noon', [])).toEqual(palette);
    const night = adjustPalette(palette, 'night', [0, 10, 255]);
    for (const i of [0, 10, 255]) expect(night.slice(i * 3, i * 3 + 3)).toEqual(palette.slice(i * 3, i * 3 + 3));
    expect(night).not.toEqual(palette);
    expect(palette).toEqual(before);
    expect(night.every((v) => v <= 63)).toBe(true);
    expect(() => adjustPalette(new Uint8Array(768).fill(255), 'night')).toThrow();
  });
});
