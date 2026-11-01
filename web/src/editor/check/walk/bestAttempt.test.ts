import { describe, expect, it } from 'vitest';
import type { Exploration } from '../explore';
import { furthestPlace } from './bestAttempt';

const place = (cell: number, tick: number, doomed = false) => ({ cell, tick, doomed }) as unknown as Exploration['places'][number];

describe('the bot’s furthest try', () => {
  it('is the place nearest a way on, not one the hero is doomed in', () => {
    const places = [place(0, 0), place(5, 10), place(8, 30, true), place(7, 20)];
    // map 10 wide, the exit at cell 9: cell 8 is nearest but doomed, so 7
    expect(furthestPlace(places, [9], 10)?.cell).toBe(7);
  });
  it('goes to the sooner of two equally near', () => {
    expect(furthestPlace([place(0, 40), place(11, 10)], [10], 10)?.tick).toBe(10);
  });
  it('has none when every place is doomed', () => {
    expect(furthestPlace([place(1, 1, true)], [9], 10)).toBeUndefined();
  });
});

describe('the closing card names the scene it stopped in', () => {
  it('a scene named only by a number says which scene it is', async () => {
    const { endingOf } = await import('./autoWalk');
    // Hi-Tech Demo's scenes are named "1" and "2": "found no way through 2" read as a scene number
    expect(endingOf('2', 'stuck', 3)).toBe('It found no way through 2 (scene 3).');
    expect(endingOf('Cave', 'stuck', 3)).toBe('It found no way through Cave.');
  });
  it('says when the hero could not move at all', async () => {
    const { endingOf } = await import('./autoWalk');
    expect(endingOf('Cave', 'stuck', 3, true)).toMatch(/could not move from where it starts/);
  });
});
