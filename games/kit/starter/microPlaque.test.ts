// Short mounts stay grounded; distant plaques and stacks float without dangling stubs.
import { describe, expect, it } from 'vitest';
import { microPlaquePostHeight, stampMicroPlaques, stampTiledSign } from './microPlaque';

const plaque = { board: [['board']], post: { x: 0, block: 'post' } };
const capture = () => {
  const cells: [number, number, string][] = [];
  return { cells, set: (x: number, y: number, name: string) => cells.push([x, y, name]) };
};

describe('Starter plaque mounts', () => {
  it('keeps a one-block support and floats the entire mount when farther away', () => {
    const short = capture();
    stampTiledSign(short, 3, 4, plaque, 1);
    expect(short.cells).toEqual([
      [3, 4, 'board'],
      [3, 5, 'post'],
    ]);
    const high = capture();
    stampTiledSign(high, 3, 4, plaque, 3);
    expect(high.cells).toEqual([[3, 4, 'board']]);
  });

  it('measures stacks from their bottom and permits an explicit maximum', () => {
    const high = capture();
    stampMicroPlaques(high, 3, 4, [plaque, plaque], 2);
    expect(high.cells).toEqual([
      [3, 4, 'board'],
      [3, 5, 'board'],
    ]);
    const allowed = capture();
    stampMicroPlaques(allowed, 3, 4, [plaque, plaque], 2, { maxPostHeight: 2 });
    expect(allowed.cells).toEqual([
      [3, 4, 'board'],
      [3, 5, 'board'],
      [3, 6, 'post'],
      [3, 7, 'post'],
    ]);
    expect(microPlaquePostHeight(1, { maxPostHeight: 0 })).toBe(0);
  });

  it('rejects invalid mount distances instead of silently floating them', () => {
    for (const height of [-1, 0.5, NaN]) expect(() => microPlaquePostHeight(height)).toThrow();
    expect(() => microPlaquePostHeight(1, { maxPostHeight: -1 })).toThrow();
  });
});
