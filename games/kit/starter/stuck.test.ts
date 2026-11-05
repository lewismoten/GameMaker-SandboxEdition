import { describe, expect, it } from 'vitest';
import { makeStuck } from './stuck';

describe('makeStuck', () => {
  it('default: only an unchanged x counts, so jitter never does', () => {
    const s = makeStuck(100, 'right');
    const xs = [104, 100, 104, 100, 104, 100, 104, 100];
    expect(xs.some((x) => s.update(x))).toBe(false);
    expect([100, 100, 100].map((x) => s.update(x))).toEqual([false, false, true]);
  });
  it('jitterWhenBlocked: no new best x for 6 ticks is blocked', () => {
    const s = makeStuck(100, 'right', true);
    const r = [104, 100, 104, 100, 104, 100, 104].map((x) => s.update(x));
    expect(r).toEqual([false, false, false, false, false, false, true]);
  });
  it('progress keeps it unblocked, and left works too', () => {
    const s = makeStuck(500, 'left', true);
    expect([496, 492, 488, 484, 480, 476, 472].some((x) => s.update(x))).toBe(false);
  });
  it('reset gives a grace period', () => {
    const s = makeStuck(100, 'right', true);
    s.reset(100);
    expect([100, 100, 100, 100, 100].some((x) => s.update(x))).toBe(false);
  });
});
