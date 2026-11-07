import { describe, expect, it } from 'vitest';
import { tagsFor, type TagFacts } from './gameTags';

const base: TagFacts = { gravity: false, shoots: false, monsters: 0, keys: false, worldW: 10, worldH: 10, scrolls: false, scenes: 3 };

describe('tagsFor', () => {
  it('gives nothing when there are no levels', () => expect(tagsFor({ ...base, scenes: 0 })).toEqual([]));
  it('gravity means a platformer', () => expect(tagsFor({ ...base, gravity: true })).toEqual(['platformer']));
  it('no gravity means top-down', () => expect(tagsFor(base)).toEqual(['top-down']));
  it('a shot and monsters make a shooter', () => expect(tagsFor({ ...base, shoots: true, monsters: 3 })).toContain('shooter'));
  it('a shot with no monsters is not a shooter', () => expect(tagsFor({ ...base, shoots: true })).not.toContain('shooter'));
  it('many monsters without a shot are action', () => expect(tagsFor({ ...base, gravity: true, monsters: 9 })).toEqual(['platformer', 'action']));
  it('keys with few monsters are a puzzle, with many keys and doors', () => {
    expect(tagsFor({ ...base, keys: true })).toContain('puzzle');
    expect(tagsFor({ ...base, keys: true, monsters: 5 })).toContain('keys and doors');
  });
  it('a scrolling game of many levels is exploration', () => {
    expect(tagsFor({ ...base, scrolls: true, scenes: 12 })).toContain('exploration');
    expect(tagsFor({ ...base, scrolls: false, scenes: 12 })).not.toContain('exploration');
  });
  it('a roomy top-down map with no monsters is a maze', () => expect(tagsFor({ ...base, worldW: 30 })).toContain('maze'));
});
