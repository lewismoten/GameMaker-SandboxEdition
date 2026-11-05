// The Starters' done filter, its remembered choice, and the tile mark.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { doneCount, doneShown, pillText, savedDoneFilter, DONE_FILTER_KEY } from './homeDone';

afterEach(() => vi.unstubAllGlobals());

describe('done filter', () => {
  it('shows by the filter', () => {
    expect([true, false].map((d) => doneShown('all', d))).toEqual([true, true]);
    expect([true, false].map((d) => doneShown('todo', d))).toEqual([false, true]);
    expect([true, false].map((d) => doneShown('done', d))).toEqual([true, false]);
  });
  it('shows no ordinary Starter under Graduations', () => expect([true, false].map((d) => doneShown('grad', d))).toEqual([false, false]));
  it('pills: Done when finished, else the grade, else nothing', () => {
    expect(pillText(true, 'B')).toBe('Done');
    expect(pillText(false, 'B-')).toBe('B-');
    expect(pillText(false, undefined)).toBeUndefined();
  });
  it('remembers Graduations', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'grad', setItem: () => undefined });
    expect(savedDoneFilter()).toBe('grad');
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
