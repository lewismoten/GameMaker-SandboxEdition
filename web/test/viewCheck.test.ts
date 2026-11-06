// The view check's edge rule (games/kit/viewCheck.ts): PLAYGAME draws a monster only when its map cell is inside 1..300 by 1..180.
import { describe, expect, it } from 'vitest';
import { edgesHiding, hiddenMonstersOfGame } from '../../games/kit/viewCheck';

describe('edgesHiding', () => {
  it('is null for a monster that is drawn', () => {
    expect(edgesHiding(100, 100, 100, 100)).toBeNull();
  });
  it('names the left edge for a cell in the left column whose sprite is in view', () => {
    expect(edgesHiding(0, 60, 6, 60)).toEqual(['left']);
  });
  it('names the top edge for a cell in the top row', () => {
    expect(edgesHiding(100, 0, 100, 8)).toEqual(['top']);
  });
  it('names the right edge past the bound', () => {
    expect(edgesHiding(310, 60, 310, 60)).toEqual(['right']);
  });
  it('is null when the sprite is mostly off screen (it is meant to be out of view)', () => {
    expect(edgesHiding(-20, 60, -15, 60)).toBeNull();
  });
});

describe('hiddenMonstersOfGame', () => {
  it('has nothing to report for a game without a walkthrough', async () => {
    expect(await hiddenMonstersOfGame('no-such-game')).toEqual([]);
  });
});
