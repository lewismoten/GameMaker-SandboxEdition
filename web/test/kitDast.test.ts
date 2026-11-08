// games/kit/dastSymmetry and dastImage: the swastika-like shape search finds a drawn swastika (either way
// round, at three sizes) and passes by plus signs, X marks and squares; the turns and silhouettes of a picture.
import { describe, expect, it } from 'vitest';
import { findSwastikaLike } from '../../games/kit/dastSymmetry';
import { rotate, silhouette, type Pix } from '../../games/kit/dastImage';

const pic = (rows: string[]): Pix => {
  const pad = '.'.repeat(rows[0].length + 4);
  const all = [pad, pad, ...rows.map((r) => `..${r}..`), pad, pad];
  return {
    w: pad.length,
    h: all.length,
    px: Uint32Array.from(
      all
        .join('')
        .split('')
        .map((c) => (c === '#' ? 0xffd040 : 0x202020)),
    ),
  };
};
const up = (rows: string[], k: number) => rows.flatMap((r) => Array<string>(k).fill([...r].map((c) => c.repeat(k)).join('')));

const swastika = ['#...#####', '#...#....', '#...#....', '#...#....', '#########', '....#...#', '....#...#', '....#...#', '#####...#'];
const plus = ['....#....', '....#....', '....#....', '....#....', '#########', '....#....', '....#....', '....#....', '....#....'];
const cross = ['#.......#', '.#.....#.', '..#...#..', '...#.#...', '....#....', '...#.#...', '..#...#..', '.#.....#.', '#.......#'];
const square = ['#########', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#########'];

describe('findSwastikaLike', () => {
  it('finds a swastika, mirrored too, at any size (once per mask: its color, its half)', () => {
    expect(findSwastikaLike(pic(swastika))).not.toHaveLength(0);
    expect(findSwastikaLike(pic(swastika.map((r) => [...r].reverse().join(''))))).not.toHaveLength(0);
    expect(findSwastikaLike(pic(up(swastika, 3)))).not.toHaveLength(0);
  });
  it('passes by mirror-symmetric shapes', () => {
    for (const rows of [plus, cross, square]) expect(findSwastikaLike(pic(rows))).toEqual([]);
  });
  it('passes by a picture of one color', () => {
    expect(findSwastikaLike({ w: 20, h: 20, px: new Uint32Array(400) })).toEqual([]);
  });
});

describe('dastImage', () => {
  it('turns a picture a quarter at a time', () => {
    const p: Pix = { w: 2, h: 1, px: Uint32Array.from([1, 2]) };
    expect(rotate(p, 1)).toEqual({ w: 1, h: 2, px: Uint32Array.from([1, 2]) });
    expect(Array.from(rotate(p, 2).px)).toEqual([2, 1]);
  });
  it('fills everything but the background solid', () => {
    const s = silhouette({ w: 3, h: 3, px: Uint32Array.from([0, 0, 0, 0, 0xff0000, 0, 0, 0, 0]) });
    expect(Array.from(s.px)).toEqual([0xffffff, 0xffffff, 0xffffff, 0xffffff, 0, 0xffffff, 0xffffff, 0xffffff, 0xffffff]);
  });
});
