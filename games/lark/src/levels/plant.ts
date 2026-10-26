// Chapter 11, The Tall Plant, seen from the side. The mustard seed grew a plant so tall it reached
// the stars, and a star got caught in its top leaves. Up the leaves from the garden: some hold
// steady, and some unfurl and fold up again on their own clocks (yellow at the tip just before);
// then a long climb with nothing to stand on, where the heart balloon carries Joe up (hold ENTER;
// a dandelion puff fills its air), more leaves, the star (walk into it and it sails home), and the
// seed in the curled top leaf, which uncurls once the star is free.
import type { BlockSet } from '../blocks/sets';
import { band } from '../blocks/plant';
import { stamp, type Stamped } from './stamp';

export const PLANT_W = 16;
export const PLANT_H = 38;

/** The leaves: row, first and last column, kind (s steady, A and B on clocks, by turns). */
export const LEAVES: [number, number, number, 's' | 'A' | 'B'][] = [
  [34, 3, 6, 's'],
  [32, 8, 11, 'A'],
  [30, 3, 6, 'B'],
  [28, 8, 11, 'A'],
  [26, 4, 6, 's'],
  [14, 3, 9, 's'],
  [12, 8, 11, 'B'],
  [10, 3, 6, 'A'],
  [8, 8, 11, 's'],
  [6, 8, 13, 's'],
  [4, 1, 6, 's'],
];
/** Dandelion puffs (the balloon's air), the star, the seed and the curled leaf in front of him. */
export const PUFFS: [number, number][] = [
  [5, 23],
  [5, 18],
];
export const STAR: [number, number] = [12, 5];
export const SEED: [number, number] = [2, 3];
export const CURL: [number, number] = [5, 3];

export function plantRows(): string[] {
  const g: string[][] = Array.from({ length: PLANT_H }, (_, y) =>
    Array.from({ length: PLANT_W }, (_, x) =>
      y >= PLANT_H - 1 ? 'G' : x === 0 || x === PLANT_W - 1 ? 'S' : y === PLANT_H - 2 && x > 8 && x < 14 ? 'P' : x === 7 ? '|' : '.',
    ),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  for (const [row, x0, x1, kind] of LEAVES) for (let x = x0; x <= x1; x++) put(x, row, kind === 's' ? (x < 7 ? 'l' : 'r') : kind === 'A' ? 'a' : 'b');
  for (const [x, y] of PUFFS) put(x, y, 'p');
  put(...STAR, '*');
  put(...SEED, 'L');
  put(...CURL, 'C');
  put(3, PLANT_H - 2, '@');
  return g.map((row) => row.join(''));
}

export function plantMap(set: BlockSet): Stamped {
  const rows = plantRows();
  // a block's look depends on how high up it is (the sky darkens): stamp row by row
  const legend: Record<string, string> = {};
  const out = rows.map((r, y) => {
    const b = band(y, PLANT_H);
    const map: Record<string, string> = {
      '.': `sky${b}`,
      S: 'edge',
      '|': `stalk${b}`,
      l: `leaf${b}`,
      r: `leafR${b}`,
      a: `leafA${b}`,
      b: `leafBfold${b}`,
      p: `puff${b}`,
      G: y === PLANT_H - 1 ? 'soil' : 'soil2',
      P: 'patch',
      '*': 'star',
      L: 'seedGlad',
      C: 'curl',
      '@': `sky${b}`,
    };
    return [...r]
      .map((ch) => {
        const name = map[ch];
        if (!name) throw new Error(`no block for ${ch}`);
        const key = Object.keys(legend).find((k) => legend[k] === name) ?? String.fromCharCode(0x100 + Object.keys(legend).length);
        legend[key] = name;
        return ch === '@' || ch === 'L' || ch === 'C' || ch === '*' ? ch : key;
      })
      .join('');
  });
  return stamp(out, { ...legend, '@': `sky${band(PLANT_H - 2, PLANT_H)}`, L: 'seedGlad', C: 'curl', '*': 'star' }, set, 'edge', undefined, '@LC*');
}
