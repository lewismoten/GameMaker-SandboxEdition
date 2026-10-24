// How the home page packs its collections of tiles into rows.
import { describe, expect, it } from 'vitest';
import { packCollections } from './homePack';

const layout = (sizes: number[], cols: number) => packCollections(sizes, cols).map((p) => [p.index, p.head.row, p.head.col, p.head.span]);

describe('packCollections', () => {
  it('fills a row with the collections that fit, in order', () => {
    // 4 + 5 + 1 + 1 + 1 in six columns: two rows of tiles
    expect(layout([4, 5, 1, 1, 1], 6)).toEqual([
      [0, 1, 1, 4],
      [2, 1, 5, 1],
      [3, 1, 6, 1],
      [1, 3, 1, 5],
      [4, 3, 6, 1],
    ]);
  });

  it('runs a long collection over rows of its own and fills the last', () => {
    const p = packCollections([4, 5, 1, 1, 1], 4);
    expect(p.map((x) => [x.index, x.head.row, x.head.col])).toEqual([
      [0, 1, 1],
      [1, 3, 1],
      [2, 5, 2],
      [3, 5, 3],
      [4, 5, 4],
    ]);
    expect(p[1].tiles).toEqual([
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 6, col: 1 },
    ]);
  });

  it('puts every tile in its own cell', () => {
    for (const cols of [1, 2, 3, 5, 7]) {
      const cells = packCollections([4, 5, 1, 1, 1, 3], cols).flatMap((p) => p.tiles.map((t) => `${t.row},${t.col}`));
      expect(new Set(cells).size).toBe(15);
      expect(cells.every((c) => +c.split(',')[1] <= cols)).toBe(true);
    }
  });
});
