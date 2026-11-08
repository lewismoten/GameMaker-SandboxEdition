// The Game picker's order and when it is left out (its DOM is checked in a real browser).
import { describe, expect, it } from 'vitest';
import { gamePicker, neighbor } from './gamePicker';

const games = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Brief' },
  { id: 'c', title: 'Realm' },
];

describe('gamePicker', () => {
  it('steps round the list in order', () => {
    expect(neighbor(games, 'a', 1)?.id).toBe('b');
    expect(neighbor(games, 'c', 1)?.id).toBe('a');
    expect(neighbor(games, 'a', -1)?.id).toBe('c');
  });
  it('is absent for one game or a game not on the list', () => {
    expect(gamePicker([games[0]], 'a', () => undefined)).toBeUndefined();
    expect(gamePicker(games, 'zzz', () => undefined)).toBeUndefined();
  });
});
