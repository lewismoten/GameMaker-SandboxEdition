import { describe, expect, it } from 'vitest';
import { CUT_H, CUT_W, GAP, cutSvg, layoutStickers, pngWithDpi, shapePath, sheetBounds, stickerSize } from '../src/manual/printables/stickerArt';

describe('sticker sheets', () => {
  const sizes = Array.from({ length: 20 }, (_, i) => {
    const shape = (['circle', 'rect', 'star', 'badge'] as const)[i % 4];
    const [w, h] = stickerSize(shape);
    return { w, h, shape };
  });

  it('packs every sticker inside the Print Then Cut area, without overlapping', () => {
    const pages = layoutStickers(sizes);
    expect(pages.flat().map((p) => p.index)).toEqual(sizes.map((_, i) => i));
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      for (const p of page) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x + p.w).toBeLessThanOrEqual(CUT_W);
        expect(p.y + p.h).toBeLessThanOrEqual(CUT_H);
      }
      for (const a of page)
        for (const b of page) {
          if (a === b) continue;
          const apart = a.x + a.w + GAP - 1e-9 <= b.x || b.x + b.w + GAP - 1e-9 <= a.x || a.y + a.h + GAP - 1e-9 <= b.y || b.y + b.h + GAP - 1e-9 <= a.y;
          expect(apart).toBe(true);
        }
    }
  });

  it('draws closed outlines, grown by the bleed', () => {
    const p = { x: 1, y: 1, w: 2, h: 1.5, shape: 'rect' as const };
    expect(shapePath(p)).toMatch(/^M.*Z$/);
    expect(shapePath(p, 0.5)).toContain('M1.14 0.5H2.86A0.64 0.64');
    expect(shapePath({ ...p, shape: 'circle' })).toContain('A1 0.75');
    expect(shapePath({ ...p, shape: 'star' }).split('L')).toHaveLength(28);
  });

  it('writes cut lines in inches, cropped to the stickers', () => {
    const page = layoutStickers(sizes.slice(0, 3))[0];
    const [, , w, h] = sheetBounds(page);
    const svg = cutSvg(page, ['A & B']);
    expect(svg).toContain(`width="${Math.round(w * 1000) / 1000}in"`);
    expect(svg).toContain(`height="${Math.round(h * 1000) / 1000}in"`);
    expect(svg.match(/<path /g)).toHaveLength(3);
    expect(svg).toContain('A &amp; B');
  });

  it('stamps a PNG with its print resolution', () => {
    const png = new Uint8Array(8 + 25 + 12);
    png.set([137, 80, 78, 71, 13, 10, 26, 10]);
    png.set([0x49, 0x48, 0x44, 0x52], 12);
    const out = pngWithDpi(png, 300);
    expect(out.length).toBe(png.length + 21);
    expect(String.fromCharCode(...out.subarray(37, 41))).toBe('pHYs');
    expect(new DataView(out.buffer).getUint32(41)).toBe(11811);
  });
});
