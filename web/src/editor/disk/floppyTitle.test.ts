import { describe, expect, it } from 'vitest';
import { fitTitle } from './floppyTitle';

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
