// The cards' POSTNET bar code: frame bars, five bars a digit with two of them tall, and a check
// digit that brings the digits to a multiple of ten.
import { describe, expect, it } from 'vitest';
import { postnetBars } from './postnet';

describe('the POSTNET bar code', () => {
  const bars = postnetBars('152130000');

  it('is a ZIP+4 and its check digit between two tall frame bars', () => {
    expect(bars.length).toBe(2 + 10 * 5);
    expect(bars[0] && bars[bars.length - 1]).toBe(true);
  });

  it('has two tall bars in every digit, and the check digit makes the sum a multiple of ten', () => {
    const groups = Array.from({ length: 10 }, (_, i) => bars.slice(1 + i * 5, 6 + i * 5));
    for (const g of groups) expect(g.filter(Boolean).length).toBe(2);
    const value = (g: boolean[]) => [7, 4, 2, 1, 0].reduce((n, w, i) => n + (g[i] ? w : 0), 0) % 11;
    const digits = groups.map(value);
    expect(digits.slice(0, 9).join('')).toBe('152130000');
    expect(digits.reduce((a, b) => a + b, 0) % 10).toBe(0);
  });
});
