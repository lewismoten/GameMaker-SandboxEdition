import { describe, expect, it } from 'vitest';
import { Grid } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGrid';

describe('Grid', () => {
  it('paints rectangles, rows and columns and gives rows of text', () => {
    const g = new Grid(4, 3).fill(0, 2, 4, 1, '#').row(0, 1, 2, 'a').col(3, 0, 1, 'b');
    expect(g.rows()).toEqual([' aab', '   b', '####']);
  });
  it('refuses a block outside the level', () => {
    expect(() => new Grid(2, 2).put(2, 0, 'x')).toThrow(/outside 2x2/);
  });
});
