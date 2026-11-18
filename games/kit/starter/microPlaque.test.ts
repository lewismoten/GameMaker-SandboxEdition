// Short mounts stay grounded; distant plaques and stacks float without dangling stubs.
import { describe, expect, it } from 'vitest';
import { addMicroPlaques, microPlaquePostHeight, stampMicroPlaques, stampTiledSign } from './microPlaque';

import { Book } from './book';
import { buildStarterPalette } from './palette';

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

it('rejects an oversized plaque before consuming any book slots', () => {
  const book = new Book('bbl', 1);
  const pal = buildStarterPalette();
  expect(() => addMicroPlaques(book, pal, { go: { lines: ['GO'] } })).toThrow();
  expect(book.index.size).toBe(0);
  expect(book.pics.size).toBe(0);
  expect(() => addMicroPlaques(book, pal, { go: { lines: ['GO'], post: false } })).not.toThrow();
});

it('keeps the default background book capacity at 150', () => {
  expect(new Book('bbl').size).toBe(150);
  expect(new Book('bbl').finish()).toHaveLength(150);
});
