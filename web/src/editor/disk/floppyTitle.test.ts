import { describe, expect, it } from 'vitest';
import { fitTitle, isBlankPicture } from './floppyTitle';

const measure = (t: string, size: number) => t.length * size * 0.6;

describe('fitTitle', () => {
  it('keeps a short title on one line at the largest size', () => {
    expect(fitTitle(measure, 'TIN HEARTS', 300, 3, 30, 12)).toEqual({ size: 30, lines: ['TIN HEARTS'] });
  });
  it('wraps a long title and never overflows', () => {
    const r = fitTitle(measure, 'THE VERY LONG ADVENTURES OF TEDDY AND GWINN', 300, 3, 30, 12);
    expect(r.lines.length).toBeLessThanOrEqual(3);
    for (const l of r.lines) expect(measure(l, r.size)).toBeLessThanOrEqual(300);
  });
  it('cuts an unbreakable word with an ellipsis at the minimum size', () => {
    const r = fitTitle(measure, 'A'.repeat(80), 300, 2, 30, 12);
    expect(r.size).toBe(12);
    expect(r.lines[0].endsWith('…')).toBe(true);
    expect(measure(r.lines[0], 12)).toBeLessThanOrEqual(300);
  });
});

describe('isBlankPicture', () => {
  const pal = new Uint8Array(768);
  pal.set([9, 9, 9], 3);
  it('is true for one palette index, or two indexes with the same color', () => {
    expect(isBlankPicture({ pixels: new Uint8Array(16), palette: pal })).toBe(true);
    expect(isBlankPicture({ pixels: new Uint8Array([0, 2, 0, 2]), palette: pal })).toBe(true);
  });
  it('is false once two colors differ', () => {
    expect(isBlankPicture({ pixels: new Uint8Array([0, 1, 0, 0]), palette: pal })).toBe(false);
  });
});
