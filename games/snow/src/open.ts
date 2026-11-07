// Level 3, "Open Snow": the same snow seen from above, one open field to walk in any of four directions. Every block
// has gravity "none", so nothing pulls the hero; pines, boulders and the fence are solid, the field and the gate are
// not. The prints it leaves are monsters (prints.ts).
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, SOLID } from '../../kit/starter/book';
import { ORIGIN } from '../../kit/starter/map';
import { addOverSign } from '../../overhead/src/blocks';
import { OverMap } from '../../overhead/src/overMap';
import type { Pal } from '../../kit/starter/palette';
import type { Level } from './levels';

const N = 20;
export const OPEN_W = 26;
export const OPEN_H = 16;
export const OPEN_START: [number, number] = [2, 8];
export const OPEN_GATE: [number, number] = [OPEN_W - 1, 8];

/** Smooth snow: pale, with a few cold-blue dimples and sparkles. */
function snowTile(pal: Pal): Pixels {
  const g = pal.r('grass');
  const p = new Pixels(N, N, g[4]);
  const rand = rng(31);
  for (let i = 0; i < 9; i++) p.rect(Math.floor(rand() * 17), Math.floor(rand() * 18), 3, 1, g[3]);
  for (let i = 0; i < 5; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), g[5]);
  return p;
}

const rows = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T........................F',
  'T........................F',
  'T..................R.....F',
  'T........................F',
  'T.....................P..F',
  'T........................F',
  'T...........RR...........F',
  'T...........R............g',
  'T........................F',
  'T........................F',
  'T..................PP....F',
  'T........................F',
  'T........................F',
  'T........................F',
  'TTTTTTTTTTTTTTTTTTTTTTTTTT',
];

export function openLevel(pal: Pal): Level {
  const book = new Book('bbl');
  const snow = snowTile(pal);
  const { c, r } = pal;
  const ink = c('ink', 0);
  book.add('snow', snow);
  for (const variant of [0, 1]) {
    // a pine from above: dark-green boughs in a star, a dusting of snow on the side the light comes from
    const g = r('green');
    const w = r('grass');
    const p = snow.crop(0, 0, N, N);
    p.disc(10.5, 11.5, 9, ink).disc(10, 11, 8.6, g[0]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + variant * 0.4;
      p.disc(10 + Math.cos(a) * 5.5, 10.5 + Math.sin(a) * 5.5, 3.4, i % 2 ? g[1] : g[0]);
    }
    p.disc(10, 10.5, 4.6, g[1]).disc(9.5, 10, 2.6, g[2]);
    const caps: [number, number, number][] = variant
      ? [
          [7, 7, 4.4],
          [14, 13, 2.2],
        ]
      : [
          [8, 6, 4.2],
          [13, 14, 2.4],
        ];
    for (const [x, y, rad] of caps) p.disc(x, y, rad, w[4]).disc(x - 1, y - 1, rad - 1.4, w[5]);
    book.add(variant ? 'pine2' : 'pine', p, { solid: SOLID });
  }
  {
    // a boulder with a cap of snow
    const s = r('stone');
    const w = r('grass');
    const p = snow.crop(0, 0, N, N);
    p.disc(10.5, 11.5, 8.6, ink).disc(10, 11, 8.2, s[1]).disc(9.5, 10, 7, s[2]).disc(9, 8.5, 4.6, s[3]);
    p.disc(9, 7.5, 3.8, w[4]).disc(8, 6.5, 2.2, w[5]);
    book.add('rock', p, { solid: SOLID });
  }
  const wood = r('wood');
  {
    // the fence along the east edge: two rails and posts down the column, snow on the rails
    const w = r('grass');
    const p = snow.crop(0, 0, N, N);
    p.rect(6, 0, 3, N, wood[3]).rect(6, 0, 1, N, wood[4]).rect(8, 0, 1, N, wood[1]);
    p.rect(12, 0, 3, N, wood[3]).rect(12, 0, 1, N, wood[4]).rect(14, 0, 1, N, wood[1]);
    for (const y of [1, 14])
      p.rect(4, y, 12, 4, wood[2])
        .frame(4, y, 12, 4, wood[0])
        .rect(5, y + 1, 10, 1, wood[4]);
    for (const y of [0, 9, 19]) p.rect(6, y, 8, 1, w[5]);
    book.add('fence', p, { solid: SOLID });
  }
  {
    // the gate: a gap in the fence with a wooden gate swung open, planks you can walk over (the exit link is on it)
    const p = snow.crop(0, 0, N, N);
    for (const y of [1, 14])
      p.rect(4, y, 12, 4, wood[2])
        .frame(4, y, 12, 4, wood[0])
        .rect(5, y + 1, 10, 1, wood[4]);
    p.rect(6, 6, 8, 8, wood[3]).frame(6, 6, 8, 8, wood[0]);
    for (const x of [8, 11]) p.rect(x, 7, 1, 6, wood[1]);
    p.disc(13, 10, 1.4, c('gold', 5));
    book.add('gate', p);
  }
  const signs = [
    addOverSign(book, pal, snow, 'lessonA', 'WALK ANY WAY AND LEAVE PRINTS', 4, 3),
    addOverSign(book, pal, snow, 'lessonB', 'PRINTS FADE IN A FEW SECONDS', 4, 3),
  ];
  const map = new OverMap(book, rows, { '.': 'snow', T: 'pine', R: 'rock', P: 'pine2', F: 'fence', g: 'gate' }, 'pine');
  // the woods around the field: pines in two looks, so no row of them repeats exactly
  for (let y = -8; y < OPEN_H + 8; y++)
    for (let x = -10; x < OPEN_W + 10; x++) if (y < 0 || y >= OPEN_H || x < 0 || x >= OPEN_W) map.set(x, y, (x * 5 + y * 3) % 7 < 3 ? 'pine2' : 'pine');
  // the first sign stands by the start so the goal is seen before the how; the second beside the way back east
  map.sign(3, 4, signs[0]).sign(14, 8, signs[1]);
  return {
    file: 'three',
    title: 'Open Snow',
    hint: 'Walk any way you like.',
    book,
    map: Object.assign(map, {
      start: [OPEN_START[0] + ORIGIN, OPEN_START[1] + ORIGIN] as [number, number],
      exits: [{ from: [OPEN_GATE[0] + ORIGIN, OPEN_GATE[1] + ORIGIN] as [number, number] }],
    }),
  };
}
