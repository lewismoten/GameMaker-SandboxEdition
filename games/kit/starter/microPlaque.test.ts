// Short mounts stay grounded; distant plaques and stacks float without dangling stubs.
import { describe, expect, it } from 'vitest';
import { stampMicroPlaques, stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';

const plaque = { board: [['board']], post: { x: 0, block: 'post' } };
const capture = () => {
  const cells: [number, number, string][] = [];
  return { cells, set: (x: number, y: number, name: string) => cells.push([x, y, name]) };
};

describe('Starter plaque mounts', () => {
  it('keeps a one-block support and floats the entire mount when farther away', () => {
    const short = capture();
    stampTiledSign(short, 3, 4, plaque, 1, { maxPostHeight: 1 });
    expect(short.cells).toEqual([
      [3, 4, 'board'],
      [3, 5, 'post'],
    ]);
    const high = capture();
    stampTiledSign(high, 3, 4, plaque, 3, { maxPostHeight: 1 });
    expect(high.cells).toEqual([[3, 4, 'board']]);
  });

  it('measures stacks from their bottom and permits an explicit maximum', () => {
    const high = capture();
    stampMicroPlaques(high, 3, 4, [plaque, plaque], 2, { maxPostHeight: 1 });
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
    const floating = capture();
    stampTiledSign(floating, 3, 4, plaque, 1, { maxPostHeight: 0 });
    expect(floating.cells).toEqual([[3, 4, 'board']]);
  });

  it('preserves unlimited posts when the option is omitted', () => {
    const single = capture();
    stampTiledSign(single, 0, 0, plaque, 3);
    expect(single.cells).toEqual([
      [0, 0, 'board'],
      [0, 1, 'post'],
      [0, 2, 'post'],
      [0, 3, 'post'],
    ]);
    const stack = capture();
    stampMicroPlaques(stack, 0, 0, [plaque, plaque], 2);
    expect(stack.cells).toEqual([
      [0, 0, 'board'],
      [0, 1, 'board'],
      [0, 2, 'post'],
      [0, 3, 'post'],
    ]);
  });

  it('floats both halves of wide posts and accepts a floating bottom plaque beyond the limit', () => {
    const wide = { board: [['left', 'right']], post: { x: 0, block: 'postLeft', rightBlock: 'postRight' } };
    const map = capture();
    stampMicroPlaques(map, 0, 0, [wide, wide], 2, { maxPostHeight: 1 });
    expect(map.cells).toEqual([
      [0, 0, 'left'],
      [1, 0, 'right'],
      [0, 1, 'left'],
      [1, 1, 'right'],
    ]);
    const floating = capture();
    stampMicroPlaques(floating, 0, 0, [{ board: [['board']] }], 2, { maxPostHeight: 1 });
    expect(floating.cells).toEqual([[0, 0, 'board']]);
  });

  it('rejects invalid mount distances instead of silently floating them', () => {
    for (const height of [-1, 0.5, NaN, Infinity]) {
      for (const stamp of [
        () => stampTiledSign(capture(), 0, 0, plaque, height, { maxPostHeight: 1 }),
        () => stampMicroPlaques(capture(), 0, 0, [plaque], height, { maxPostHeight: 1 }),
        () => stampTiledSign(capture(), 0, 0, plaque, 1, { maxPostHeight: height }),
        () => stampMicroPlaques(capture(), 0, 0, [plaque], 1, { maxPostHeight: height }),
      ])
        expect(stamp).toThrow('height');
    }
  });
});
