import { describe, expect, it } from 'vitest';
import type { Walkthrough } from '../../../walkthrough/format';
import { changedAfter, redoLevels, redoReuse } from './redoLevel';

const walk = (keys: string[]): Walkthrough => ({
  version: 1,
  game: 'g',
  rand: { seed: 1, per: 'game' },
  segments: keys.map((k, i) => ({ scene: i + 2, keys: k })),
  chapters: keys.map((_, i) => ({ scene: i + 2, title: `Level ${i + 1}` })),
  timeline: { fps: 60, frames: 100, chapters: [] },
});

describe('redo one level', () => {
  it('lists the walkthrough’s levels by chapter name', () => {
    expect(redoLevels(walk(['a', 'b']))).toEqual([
      { scene: 2, title: 'Level 1' },
      { scene: 3, title: 'Level 2' },
    ]);
  });
  it('keeps every other scene’s keys and leaves the redone one for the bot', () => {
    const r = redoReuse(walk(['a', 'b', 'c']), [{ scene: 3, name: 'x', strategy: 'runner', tried: [] } as never], 3, 'runner');
    expect(r.map((x) => x?.keys)).toEqual(['a', undefined, 'c']);
    expect(r[0]?.strategy).toBe('runner');
  });
  it('names the later scenes whose keys changed, not earlier ones', () => {
    const before = walk(['a', 'b', 'c', 'd']);
    const after = walk(['A', 'B', 'c', 'D']);
    expect(changedAfter(before, after, 3)).toEqual([5]);
    expect(changedAfter(before, before, 3)).toEqual([]);
    expect(changedAfter(before, after, 99)).toEqual([]);
  });
});
