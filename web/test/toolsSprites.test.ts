// Shared sprite operations preserve palette indexes, in-place variants, and fractional sampling.
import { expect, it } from 'vitest';
import { Pixels, outline, outlineInPlace, scaleBlitTransparent, asciiSprite, turn90, resampleBlit } from '@lewismoten/gamemaker-sandbox-tools/drawing';
it('supports copied and in-place outlines with configurable transparent and excluded ink', () => {
  const src = new Pixels(5, 5, 255).set(2, 2, 1);
  expect(outline(src, 1, { ignoreInk: true }).px).toEqual(src.px);
  const edged = outline(src, 2);
  expect(edged.get(1, 2)).toBe(2);
  expect(src.get(1, 2)).toBe(255);
  expect(outlineInPlace(src, 2)).toBe(src);
  expect(src.px).toEqual(edged.px);
  expect(outline(new Pixels(3, 3, 0).set(1, 1, 4), 2, { transparent: 0 }).get(0, 1)).toBe(2);
});
it('keeps explicit transparency and fractional nearest-pixel scaling separate', () => {
  const src = new Pixels(2, 2, 0).set(1, 1, 5),
    dst = new Pixels(5, 5, 7);
  scaleBlitTransparent(dst, src, 0, 0, 2, 0);
  expect(dst.get(0, 0)).toBe(7);
  expect(dst.get(3, 3)).toBe(5);
  const tiny = new Pixels(2, 2, 255);
  resampleBlit(tiny, new Pixels(2, 2, 4), 0, 0, 0.5);
  expect(tiny.get(0, 0)).toBe(4);
  expect(tiny.get(1, 0)).toBe(255);
});
it('handles rectangular rotations and bottom-aligned ASCII sprites', () => {
  const rotated = turn90(new Pixels(7, 5, 255).set(6, 0, 4));
  expect([rotated.w, rotated.h, rotated.get(4, 6)]).toEqual([5, 7, 4]);
  const sprite = asciiSprite(['ab', ' b'], { a: 2, b: 3 });
  expect(sprite.get(9, 18)).toBe(2);
  expect(sprite.get(10, 19)).toBe(3);
  expect(sprite.get(0, 0)).toBe(255);
});
