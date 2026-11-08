import { describe, expect, it } from 'vitest';
import { stutterLevel, stutterNote, readMs, TICK_MS } from './vocLimit';

describe('stutter estimates', () => {
  it('grades by size', () => {
    expect(stutterLevel(5000)).toBe('ok');
    expect(stutterLevel(10_000)).toBe('maybe');
    expect(stutterLevel(32_000)).toBe('likely');
    expect(stutterLevel(70_000)).toBe('toobig');
  });
  it('yellow is about a tick on a 286, red about two', () => {
    expect(readMs(10_000, 'pc286')).toBeCloseTo(TICK_MS, -1);
    expect(readMs(32_000, 'pc286') / TICK_MS).toBeGreaterThan(1.9);
  });
  it('words a suggestion with the estimate', () => {
    expect(stutterNote(2000)).toBe('');
    expect(stutterNote(20_000)).toMatch(/estimated .* on a 286/);
  });
});
