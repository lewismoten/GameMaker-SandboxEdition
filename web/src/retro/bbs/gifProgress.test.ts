// The progress line the GIF Gallery writes along the picture's bottom while it downloads.
import { describe, expect, it } from 'vitest';
import { progressLine } from './gifArea';
import { fromCp437 } from '../text/cp437';

describe('progressLine', () => {
  it('fits the 40 columns of a 320-wide picture screen, from nothing to the whole file', () => {
    for (const [got, total] of [
      [0, 149_999],
      [74_000, 149_999],
      [149_999, 149_999],
    ])
      expect(progressLine(got, total).length).toBeLessThanOrEqual(40);
  });

  it('shows a bar, the percent and the bytes so far', () => {
    expect(fromCp437(progressLine(5_000, 20_000))).toBe('███░░░░░░░░░ 25%  5,000 of 20,000');
    expect(fromCp437(progressLine(20_000, 20_000))).toBe('████████████ 100%  20,000 of 20,000');
  });
});
