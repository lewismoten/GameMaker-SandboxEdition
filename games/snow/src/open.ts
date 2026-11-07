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
  'T............H...........F',
  'T............B...........F',
  'T........................g',
  'T........................F',
  'T........................F',
  'T.....................PP.F',
  'T........................F',
  'T........................F',
  'T........................F',
  'TTTTTTTTTTTTTTTTTTTTTTTTTT',
];

/** A pine seen from above: three rings of pointed boughs, each a little smaller and lighter, snow on the high side. */
function pineTop(snow: Pixels, pal: Pal, tips: number, turn: number, snowy: number): Pixels {
  const g = pal.r('green');
  const w = pal.r('grass');
  const ink = pal.c('ink', 0);
  const p = snow.crop(0, 0, N, N);
  const cx = 9.8;
  const cy = 10.8;
  // a star of `k` pointed boughs: between 66% and 100% of `big` from the middle
  const star = (big: number, k: number, rot: number, col: number, shade: number) => {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const edge = big * (0.66 + 0.34 * Math.abs(Math.cos(((Math.atan2(dy, dx) - rot) * k) / 2)));
        const d = Math.hypot(dx, dy);
        if (d > edge) continue;
        // the lower-right of each tier is in its own shadow; the upper-left rim catches snow
        const side = (dx + dy) / (d || 1);
        p.set(x, y, side > 0.55 && d > edge - 2.2 ? shade : col);
      }
  };
  // each tier has a dark edge, so the layers read as boughs stacked up to the peak
  star(10, tips, turn, ink, ink);
  star(9.2, tips, turn, g[1], g[0]);
  star(7.4, tips, turn + Math.PI / tips, ink, ink);
  star(6.7, tips, turn + Math.PI / tips, g[2], g[1]);
  star(4.7, tips, turn, ink, ink);
  star(4, tips, turn, g[3], g[2]);
  // a snowy peak
  p.disc(cx - 0.4, cy - 0.4, 3 + snowy * 0.4, w[4]).disc(cx - 1, cy - 1, 1.8, w[5]);
  for (const [x, y] of [
    [4, 6 + snowy],
    [7, 3],
    [14 - snowy, 4],
  ])
    p.disc(x, y, 1, w[5]);
  return p;
}

/** The snowman seen from above at a slant: his head (a smile and a carrot nose) over his round body. */
function snowmanTiles(snow: Pixels, pal: Pal): { head: Pixels; body: Pixels } {
  const w = pal.r('grass');
  const ink = pal.c('ink', 0);
  const coal = pal.c('ink', 1);
  const carrot = pal.c('orange', 3);
  const wood = pal.r('wood');
  const red = pal.r('red');
  const head = snow.crop(0, 0, N, N);
  head.disc(10.5, 11.5, 8, ink).disc(10, 11, 7.6, w[3]).disc(9.5, 10.5, 6.8, w[4]).disc(8.5, 9, 4.6, w[5]);
  head.disc(7, 8.5, 1.1, coal).disc(12.8, 8.5, 1.1, coal);
  // a carrot nose pointing at the viewer, and a smile
  head.rect(9, 10, 3, 3, carrot).rect(9, 13, 2, 1, carrot);
  for (const [x, y] of [
    [5, 13],
    [6, 14],
    [7, 15],
    [8, 15],
    [11, 15],
    [12, 15],
    [13, 14],
    [14, 13],
  ])
    head.set(x, y, coal);
  const body = snow.crop(0, 0, N, N);
  body.disc(10.5, 10.5, 9.4, ink).disc(10, 10, 9, w[3]).disc(9.5, 9, 8, w[4]).disc(8.5, 7.5, 5, w[5]);
  // twig arms, a red scarf at the top and two coal buttons
  body.line(0, 8, 4, 10, wood[2]).line(19, 8, 15, 10, wood[2]);
  body.rect(3, 0, 14, 3, red[2]).rect(3, 0, 14, 1, red[3]).rect(11, 3, 3, 4, red[2]);
  body.disc(10, 11, 1.2, coal).disc(10, 15, 1.2, coal);
  return { head, body };
}

export function openLevel(pal: Pal): Level {
  const book = new Book('bbl');
  const snow = snowTile(pal);
  const { c, r } = pal;
  const ink = c('ink', 0);
  book.add('snow', snow);
  book.add('pine', pineTop(snow, pal, 8, 0.2, 0), { solid: SOLID });
  book.add('pine2', pineTop(snow, pal, 7, 0.9, 1), { solid: SOLID });
  book.add('pine3', pineTop(snow, pal, 9, 0.5, 2), { solid: SOLID });
  {
    const { head, body } = snowmanTiles(snow, pal);
    book.add('snowman-head', head, { solid: SOLID });
    book.add('snowman-body', body, { solid: SOLID });
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
    addOverSign(book, pal, snow, 'lessonC', 'WALK AROUND THE SNOWMAN', 4, 3),
  ];
  const map = new OverMap(book, rows, { '.': 'snow', T: 'pine', R: 'rock', P: 'pine2', H: 'snowman-head', B: 'snowman-body', F: 'fence', g: 'gate' }, 'pine');
  // the woods around the field: pines in three looks, so no row of them repeats exactly
  for (let y = -8; y < OPEN_H + 8; y++)
    for (let x = -10; x < OPEN_W + 10; x++)
      if (y < 0 || y >= OPEN_H || x < 0 || x >= OPEN_W) map.set(x, y, ['pine', 'pine2', 'pine3'][(((x * 5 + y * 3 + ((x * y) & 3)) % 3) + 3) % 3]);
  // the first sign stands by the start so the goal is seen before the how; the second beside the way back east
  map.sign(3, 4, signs[0]).sign(18, 8, signs[1]).sign(6, 10, signs[2]);
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
