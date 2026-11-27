import { describe, expect, it } from 'vitest';
import { Grid } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGrid';

describe('Grid', () => {
  it('paints rectangles, rows and columns and gives rows of text', () => {
    const g = new Grid(4, 3).fill(0, 2, 4, 1, '#').row(0, 1, 2, 'a').col(3, 0, 1, 'b');
    expect(g.rows()).toEqual([' aab', '   b', '####']);
  });
  it('leaves the grid unchanged when a fill extends outside the level', () => {
    const g = new Grid(2, 1);
    expect(() => g.fill(1, 0, 2, 1, 'x')).toThrow(/outside 2x1/);
    expect(g.rows()).toEqual(['  ']);
  });
  it('refuses a block outside the level', () => {
    expect(() => new Grid(2, 2).put(2, 0, 'x')).toThrow(/outside 2x2/);
  });

  it.each(['', 'abc', '😀'])('refuses a tile that changes the row width (%j)', (tile) => {
    const g = new Grid(2, 1).put(1, 0, 'x');
    expect(() => g.put(0, 0, tile)).toThrow(/one character/);
    expect(g.rows()).toEqual([' x']);
  });
});
