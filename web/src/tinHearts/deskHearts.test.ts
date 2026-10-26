// The room's tin heart: the chicken's pops are counted across visits, the heart comes out with
// every pop after the first few until it is taken, taking it is kept once, and whether someone
// had every game's heart before it joined is decided once.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { chickenPopped, clockHeartTaken, clockPops, grandfathered, POPS_BEFORE_HEART, takeClockHeart } from './deskHearts';

const store = new Map<string, string>();

describe('the clock heart', () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('comes out on every pop after the first few, until it is found', () => {
    const seen = Array.from({ length: POPS_BEFORE_HEART + 2 }, () => chickenPopped(false));
    expect(seen).toEqual([...Array(POPS_BEFORE_HEART).fill(false), true, true]);
    expect(clockPops()).toBe(POPS_BEFORE_HEART + 2);
    // found (taken, or added in EGG.EXE): the chicken comes out alone
    expect(chickenPopped(true)).toBe(false);
  });

  it('counts the pops across visits (kept in localStorage)', () => {
    for (let i = 0; i < POPS_BEFORE_HEART - 1; i++) chickenPopped(false);
    expect(store.get('gm-clock-pops')).toBe(String(POPS_BEFORE_HEART - 1));
    // a new visit reads the same count
    expect(chickenPopped(false)).toBe(false);
    expect(chickenPopped(false)).toBe(true);
  });

  it('keeps the first time it was taken', () => {
    expect(clockHeartTaken()).toBeUndefined();
    takeClockHeart(new Date('2026-10-26T12:00:00Z'));
    takeClockHeart(new Date('2026-12-25T12:00:00Z'));
    expect(clockHeartTaken()).toBe('2026-10-26T12:00:00.000Z');
  });

  it('decides the grandfathering once, the first time it is asked', () => {
    expect(grandfathered(false)).toBe(false);
    expect(grandfathered(true)).toBe(false);
    store.clear();
    expect(grandfathered(true)).toBe(true);
    expect(grandfathered(false)).toBe(true);
  });
});
