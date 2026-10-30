// Reusable fonts retain both letter styles, the extended symbols, custom art, and legacy effect placement.
import { expect, it } from 'vitest';
import { microGlyphs } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { Pixels, createPcText, createMicroText } from '@lewismoten/gamemaker-sandbox-tools/drawing';
it('retains exact font coverage and spacing when adapting older lettering', () => {
  const glyphs = microGlyphs(' A?');
  expect(glyphs['¢']).toBeUndefined();
  const space = createMicroText({ glyphs, fallback: ' ' });
  const question = createMicroText({ glyphs, fallback: '?', trailingGap: true });
  const blank = new Pixels(12, 5, 255),
    marked = new Pixels(12, 5, 255);
  expect(space(blank, 0, 0, '¢', 3)).toBe(3);
  expect(blank.px.every((c) => c === 255)).toBe(true);
  expect(question(marked, 0, 0, '¢', 3)).toBe(4);
  expect(marked.px.some((c) => c === 3)).toBe(true);
});
it('draws consumer-owned multicolor micro glyphs with their own advance', () => {
  const custom = new Pixels(5, 5, 255).set(0, 0, 6).set(4, 4, 7);
  const draw = createMicroText({ custom: (ch) => (ch === '@' ? custom : undefined) });
  const p = new Pixels(20, 12, 255);
  expect(draw(p, 0, 0, '@A', 3, 2)).toBe(18);
  expect(p.get(0, 0)).toBe(6);
  expect(p.get(9, 9)).toBe(7);
});
it('distinguishes proportional and absolute shadow offsets and treats zero as ink', () => {
  const p = new Pixels(64, 32, 255),
    expected = new Pixels(64, 32, 255);
  const custom = () => new Pixels(8, 8, 255).set(0, 0, 6);
  const effect = createPcText({ custom, shadowPixels: (scale) => [[scale + 1, scale + 1]] });
  effect.outlined(p, 10, 8, 'A', 4, 1, 3, 0);
  const one = createPcText({ custom: (_ch, color, flat) => new Pixels(8, 8, 255).set(0, 0, flat ? color : 6) });
  // The custom shape uses its supplied colors. The background beside its final glyph stays transparent.
  expect(p.get(14, 12)).toBe(6);
  expect(p.get(10, 8)).toBe(6);
  expect(p.get(17, 15)).toBe(255);
  one.outlined(expected, 10, 8, 'A', 4, 1, 3, 0);
  expect(expected.get(16, 14)).toBe(0);
});
