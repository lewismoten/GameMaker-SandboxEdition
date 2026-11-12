// The night hill's sky: faint star dots, three constellations, a full moon, and on the grass a blanket and
// a telescope. Ordinary blocks drawn over the sky (a copy of the game can edit them in the Blocks tab). The
// twinkling stars and the shooting stars are monsters (monsters.ts). No crescent: the moon is full.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { StarterMap } from '../../kit/starter/map';
import { TWINK, SHOOT } from './monsters';

const VARIANTS = 6;

/** A small seeded integer hash (no Math.random: the same sky every build). */
function hash(a: number, b: number, c: number): number {
  let h = (Math.imul(a + 1, 374761393) + Math.imul(b + 1, 668265263) + Math.imul(c + 1, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export const NIGHT_BLOCKS = ['dots0', 'cstar', 'moon', 'blanketL', 'blanketR', 'telescope'] as const;

export function addNightBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  const sky = () => new Pixels(20, 20, skyOf(pal));
  const w = pal.c('white', 3);
  const dim = pal.c('white', 1);
  // six starfield blocks with different dot layouts (one nearly empty), drawn from a seeded hash so a rebuild is byte for byte the same
  const DOTS = [1, 2, 3, 4, 5, 2];
  for (let v = 0; v < DOTS.length; v++) {
    const p = sky();
    for (let i = 0; i < DOTS[v]; i++) {
      const x = 1 + (hash(v, i, 1) % 18);
      const y = 1 + (hash(v, i, 2) % 18);
      p.set(x, y, hash(v, i, 3) % 4 === 0 ? w : dim);
    }
    book.add(`dots${v}`, p, air);
  }
  // a constellation star: the bright star shrunk to a small point of light
  const c = sky();
  const rows = ['..#..', '.###.', '#####', '.###.', '.#.#.'];
  rows.forEach((row, dy) => [...row].forEach((ch, dx) => ch === '#' && c.rect(7 + dx, 7 + dy, 1, 1, pal.c('white', 2))));
  c.set(9, 9, w);
  book.add('cstar', c, air);
  // the full moon, with a few craters
  const m = sky();
  m.disc(10, 10, 8.4, pal.c('white', 3)).disc(10, 10, 8.4, pal.c('white', 3));
  for (const [x, y, r] of [
    [7, 8, 2],
    [13, 12, 2.4],
    [11, 6, 1.4],
    [6, 13, 1.2],
  ] as const)
    m.disc(x, y, r, pal.c('white', 2));
  m.ring(10, 10, 8, pal.c('white', 2));
  book.add('moon', m, air);
  // a picnic blanket: red and cream squares, two blocks wide, lying on the grass
  for (const side of ['L', 'R'] as const) {
    const p = sky();
    for (let x = 0; x < 20; x++) for (let y = 14; y < 20; y++) p.set(x, y, ((x >> 2) + (y >> 1)) % 2 ? pal.c('red', 2) : pal.c('parch', 3));
    p.rect(0, 13, 20, 1, pal.c('red', 4));
    book.add(`blanket${side}`, p, air);
  }
  // a small telescope on a tripod, pointing up and to the right
  const t = sky();
  const ink = pal.c('ink', 0);
  const tube = pal.c('teal', 2);
  t.line(10, 12, 5, 19, ink).line(10, 12, 15, 19, ink).line(10, 12, 10, 19, ink);
  for (let i = 0; i < 4; i++) t.line(5 + i, 12 - i, 14 + i, 3 - i + 2, tube);
  t.line(4, 12, 13, 4, ink).line(8, 14, 17, 6, ink);
  t.disc(16, 5, 1.6, pal.c('gold', 4));
  book.add('telescope', t, air);
}

/** Dots, three constellations, the moon, the blanket and the telescope, and the monsters that twinkle and streak. */
export function paintNight(m: StarterMap, width: number, skip: readonly [number, number]): void {
  for (let x = 1; x < width - 1; x++)
    for (let y = 0; y < 8; y++) if (x < skip[0] || x > skip[1]) if (hash(x, y, 7) % 100 < 70) m.set(x, y, `dots${hash(x, y, 9) % VARIANTS}`);
  const dipper = [
    [3, 1],
    [5, 1],
    [7, 2],
    [9, 3],
    [12, 3],
    [12, 1],
    [9, 1],
  ];
  const cassiopeia = [
    [28, 1],
    [30, 3],
    [32, 1],
    [34, 3],
    [36, 1],
  ];
  const belt = [
    [42, 2],
    [44, 2],
    [46, 2],
  ];
  for (const [x, y] of [...dipper, ...cassiopeia, ...belt]) m.set(x, y, 'cstar');
  m.set(24, 1, 'moon');
  m.set(10, 9, 'blanketL').set(11, 9, 'blanketR').set(13, 9, 'telescope');
  const twinkles = [
    [2, 4],
    [16, 2],
    [19, 4],
    [22, 2],
    [27, 4],
    [39, 2],
    [40, 4],
    [49, 3],
    [55, 2],
    [20, 0],
    [34, 0],
    [57, 4],
  ];
  for (const [x, y] of twinkles) m.mon(TWINK, x, y);
  m.mon(SHOOT, 17, 0).mon(SHOOT, 38, 0);
}
