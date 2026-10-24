// The Sandbox Scoop's issue numbers: one per game, in release order, never repeated.
import { describe, expect, it } from 'vitest';
import { scoopIssue } from './scoopIssue';

const games = [
  { id: 'b', title: 'Bravo', year: 1995 },
  { id: 'a', title: 'Alpha', year: 1995 },
  { id: 'c', title: 'Charlie', year: 1994 },
];

describe('the Sandbox Scoop’s issue number', () => {
  it('numbers games by year, then title, starting at 1', () => {
    expect(['c', 'a', 'b'].map((id) => scoopIssue(id, games))).toEqual([1, 2, 3]);
  });

  it('gives a game outside the list the next number', () => {
    expect(scoopIssue('z', games)).toBe(4);
  });
});
