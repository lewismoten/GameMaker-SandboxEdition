import { describe, expect, it } from 'vitest';
import type { SavedWalk } from '../check/walk/keptWalk';
import type { CatalogEntry } from '../../project/files';
import { walkSource } from './walkRoute';

const saved = (frames: number): SavedWalk => ({
  when: 'now',
  won: true,
  scenes: [],
  walk: { version: 1, game: 'g', rand: { seed: 1, per: 'game' }, segments: [], chapters: [], timeline: { fps: 60, frames, chapters: [] } },
});
const shipped = { walkthrough: true } as unknown as CatalogEntry;

describe('which walkthrough a game already has', () => {
  it('has none: the making dialog', () => {
    expect(walkSource(undefined, undefined)).toBeUndefined();
    expect(walkSource({ when: 'now', won: false, scenes: [] }, undefined)).toBeUndefined();
    expect(walkSource(saved(0), undefined)).toBeUndefined();
  });
  it('a kept or just-made one plays, even over a shipped one', () => {
    expect(walkSource(saved(300), undefined)).toBe('kept');
    expect(walkSource(saved(300), shipped)).toBe('kept');
  });
  it('a shipped one plays when nothing was made', () => {
    expect(walkSource(undefined, shipped)).toBe('shipped');
  });
});
