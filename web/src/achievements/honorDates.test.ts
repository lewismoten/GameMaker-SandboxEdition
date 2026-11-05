// The day each honors was earned: first finish only, in this browser.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HONOR_DATES_KEY, clearHonorDates, loadHonorDates, noteHonor } from './honorDates';

function store(): Record<string, string> {
  const saved: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => saved[k] ?? null,
    setItem: (k: string, v: string) => (saved[k] = v),
    removeItem: (k: string) => delete saved[k],
  });
  return saved;
}
afterEach(() => vi.unstubAllGlobals());

describe('honor dates', () => {
  it('keeps the first day only', () => {
    store();
    noteHonor('graduation-basics', new Date(2026, 10, 5));
    noteHonor('graduation-basics', new Date(2026, 11, 25));
    expect(loadHonorDates()).toEqual({ 'graduation-basics': '2026-11-05' });
  });
  it('drops anything that is not a day, and clears', () => {
    const s = store();
    s[HONOR_DATES_KEY] = JSON.stringify({ a: '2026-01-02', b: 'soon', c: 5 });
    expect(loadHonorDates()).toEqual({ a: '2026-01-02' });
    clearHonorDates();
    expect(loadHonorDates()).toEqual({});
  });
  it('survives a broken record or no storage', () => {
    store()[HONOR_DATES_KEY] = '{oops';
    expect(loadHonorDates()).toEqual({});
    vi.stubGlobal('localStorage', undefined);
    expect(() => noteHonor('x')).not.toThrow();
  });
});
