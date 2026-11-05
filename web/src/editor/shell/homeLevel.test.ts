// The Starters tab's level filter: which courses and graduations show under a level, and the remembered choice.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CEREMONIES, DIPLOMA, stageGames } from '../../project/ceremonies';
import { LEVELS, LEVEL_KEY, levelShown, levelShowsCeremony, savedLevel } from './homeLevel';

afterEach(() => vi.unstubAllGlobals());

describe('level filter', () => {
  it('has a level per stage', () => expect(LEVELS).toHaveLength(CEREMONIES.length));
  it('all levels show everything, even a Starter in no stage', () => {
    expect(levelShown(0, stageGames(CEREMONIES[0])[0])).toBe(true);
    expect(levelShown(0, 'not-a-course')).toBe(true);
  });
  it('a level shows only its stage', () => {
    const first = stageGames(CEREMONIES[0])[0];
    const third = stageGames(CEREMONIES[2])[0];
    expect([levelShown(1, first), levelShown(1, third), levelShown(3, third)]).toEqual([true, false, true]);
    expect(levelShown(1, 'not-a-course')).toBe(false);
  });
  it('every course shows under exactly its own level', () => {
    for (const [i, c] of CEREMONIES.entries()) for (const id of stageGames(c)) expect(LEVELS.filter((n) => levelShown(n, id))).toEqual([i + 1]);
  });
  it('a level shows its graduation; the diploma only under all', () => {
    expect(CEREMONIES.map((c) => levelShowsCeremony(2, c.id))).toEqual(CEREMONIES.map((_, i) => i === 1));
    expect([levelShowsCeremony(0, DIPLOMA.id), levelShowsCeremony(2, DIPLOMA.id)]).toEqual([true, false]);
  });
  it('remembers a level, and falls back to all', () => {
    vi.stubGlobal('localStorage', { getItem: (k: string) => (k === LEVEL_KEY ? '4' : null) });
    expect(savedLevel()).toBe(4);
    vi.stubGlobal('localStorage', { getItem: () => '99' });
    expect(savedLevel()).toBe(0);
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
    });
    expect(savedLevel()).toBe(0);
  });
});
