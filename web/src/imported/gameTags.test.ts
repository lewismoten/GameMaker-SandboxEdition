import { describe, expect, it } from 'vitest';
import { tagsFor, type TagFacts } from './gameTags';

const base: TagFacts = { gravScenes: 0, facing: true, jump: false, shoots: false, monsters: 0, keys: false, worldW: 10, scrollScenes: 0, scenes: 4 };
const side: TagFacts = { ...base, gravScenes: 4, jump: true };

describe('tagsFor', () => {
  it('gives nothing when there are no levels', () => expect(tagsFor({ ...base, scenes: 0 })).toEqual([]));
  it('gravity and a jump key make a platformer', () => expect(tagsFor(side)).toEqual(['platformer']));
  it('gravity without a jump is neither platformer nor top-down', () => expect(tagsFor({ ...side, jump: false })).toEqual([]));
  it('gravity in a minority of levels is not a platformer', () => expect(tagsFor({ ...side, gravScenes: 1 })).toEqual([]));
  it('no gravity and a hero that faces up and down is top-down', () => expect(tagsFor(base)).toEqual(['top-down']));
  it('a fired shot and a swarm of monsters make a shooter', () => expect(tagsFor({ ...side, shoots: true, monsters: 100 })).toContain('shooter'));
  it('a shot with no monsters is not a shooter', () => expect(tagsFor({ ...side, shoots: true })).not.toContain('shooter'));
  it('keys with no fighting are a puzzle, with fighting keys and doors', () => {
    expect(tagsFor({ ...base, keys: true })).toContain('puzzle');
    expect(tagsFor({ ...side, keys: true, monsters: 5 })).toContain('keys and doors');
  });
  it('a roomy top-down map with no monsters is a maze', () => expect(tagsFor({ ...base, worldW: 30 })).toContain('maze'));
});
