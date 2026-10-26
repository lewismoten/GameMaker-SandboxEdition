// The floppy sticker's cut line: a 3½" disk standing shutter down, so its clipped corner is at
// the bottom left and the other three corners are only rounded.
import { describe, expect, it } from 'vitest';
import { inside, outline } from './stickerGeom';

describe('the floppy sticker', () => {
  const w = 1.55;
  const h = 1.55;
  const cut = outline({ w, h, shape: 'floppy' });
  const e = 0.03;

  it('clips the bottom-left corner, under the shutter side', () => {
    expect(inside(cut, e, h - e)).toBe(false);
    expect(inside(cut, w * 0.2, h - e)).toBe(true);
  });

  it('keeps the top corners and the bottom right whole, for the write-protect and density holes', () => {
    expect(inside(cut, w * 0.07, h * 0.08)).toBe(true);
    expect(inside(cut, w * 0.93, h * 0.08)).toBe(true);
    expect(inside(cut, w - 0.04, h - 0.04)).toBe(true);
  });
});
