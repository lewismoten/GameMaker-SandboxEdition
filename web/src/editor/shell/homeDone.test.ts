// The Starters' done filter, its remembered choice, and the tile mark.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { doneCount, doneShown, savedDoneFilter, DONE_FILTER_KEY } from './homeDone';

afterEach(() => vi.unstubAllGlobals());

describe('done filter', () => {
  it('shows by the filter', () => {
    expect([true, false].map((d) => doneShown('all', d))).toEqual([true, true]);
    expect([true, false].map((d) => doneShown('todo', d))).toEqual([false, true]);
    expect([true, false].map((d) => doneShown('done', d))).toEqual([true, false]);
  });
  it('counts', () => expect(doneCount(3, 7)).toBe('3 of 7 done'));
  it('is remembered, and falls back to all', () => {
    const saved: Record<string, string> = {};
    vi.stubGlobal('localStorage', { getItem: (k: string) => saved[k] ?? null, setItem: (k: string, v: string) => (saved[k] = v) });
    expect(savedDoneFilter()).toBe('all');
    saved[DONE_FILTER_KEY] = 'todo';
    expect(savedDoneFilter()).toBe('todo');
    saved[DONE_FILTER_KEY] = 'bogus';
    expect(savedDoneFilter()).toBe('all');
  });
});
