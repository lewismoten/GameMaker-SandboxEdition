// WIRED ROOM's own blocks, added to the Starter block set after the signs. Everything is wired with counters:
//   leverRed, leverRedOn    a red lever: touch it and counter 22 goes up by 3 planks, and it flips
//   leverBlue, leverBlueOn  a blue lever: the same for counter 23 (level 2's bridge)
//   leverHatch              the odd red lever: it puts 1 on counter 24, which only the hatch spends
//   ghostRed, ghostBlue     a plank that is not there yet: it turns solid and takes one off its counter
//                           when the counter has one to give; with an empty counter the touch is refused
//   hatch, hatchOpen        a trap door in the path: solid, and the red lever's counter 24 opens it. With 24
//                           empty it stays shut, so Lian walks over it
//   poolTop, pool, cave     a soft drop: water that does not hurt, and a hole in the ground. A link at the
//                           bottom of each sends the hero back to the way in (game.ts)
// No lever talks to a plank or a hatch: they only share a counter. "Both levers" is just 3 + 3 being the
// 6 a bridge of six planks spends. The hero's counters 22, 23 and 24 start at 1 (a counter shows one less).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The counters: level 1's planks, level 2's planks, and level 2's hatch. */
export const ONE = 22;
export const TWO = 23;
export const HATCH = 24;
/** Planks in one bridge; each lever on its bridge's counter gives half of them. */
export const PLANKS = 6;
export const HALF = PLANKS / 2;
/** Cells in the hatch; each spends one from counter 24, so the red lever gives that many. */
export const HATCH_CELLS = 2;

type Color = 'red' | 'blue';

/** A lever on a stone base: the handle leans left (waiting) or right (pulled), with a bar-shaped grip in the color; the base lamp is lit when pulled. */
function lever(pal: Pal, color: Color, pulled: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  const c = pal.r(color);
  const g = pal.r('gold');
  const tipX = pulled ? 15 : 4;
  for (const d of [-1, 0, 1]) p.line(10 + d, 13, tipX + d, 5, d === 1 ? s[1] : d === 0 ? s[3] : s[4]);
  p.rect(tipX - 3, 1, 8, 4, c[3])
    .rect(tipX - 3, 1, 8, 1, c[4])
    .rect(tipX - 3, 4, 8, 1, c[1]);
  p.rect(1, 13, 18, 7, s[3]).rect(1, 13, 18, 1, s[4]).rect(1, 19, 18, 1, s[1]);
  p.rect(4, 15, 6, 2, s[0]);
  p.rect(13, 15, 4, 3, pulled ? g[4] : s[1]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** A plank that is not there yet: a dotted outline of a plank in the color, with its nails. */
function ghost(pal: Pal, color: Color): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const c = pal.r(color);
  const dot = c[1]; // not a shade the pool uses, so the Level check does not take the pool for sky
  for (let x = 0; x < 20; x += 6) p.rect(x, 0, 4, 2, dot).rect(x, 6, 4, 2, dot);
  p.rect(0, 0, 2, 3, dot).rect(0, 5, 2, 3, dot).rect(18, 0, 2, 3, dot).rect(18, 5, 2, 3, dot);
  for (let x = 4; x < 16; x += 4) p.rect(x, 3, 2, 1, dot);
  p.set(3, 4, dot).set(16, 4, dot);
  return p;
}

/** A pool cell: the top one shows the surface (waves and a glint) under a little sky, the deep one is plain. */
function pool(pal: Pal, top: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const b = pal.r('blue');
  const y0 = top ? 4 : 0;
  p.rect(0, y0, 20, 20 - y0, b[2]);
  if (top) {
    p.rect(0, y0, 20, 2, b[4]);
    for (const x of [1, 6, 11, 16]) p.rect(x, y0 - 1, 3, 1, b[4]).rect(x + 1, y0 - 2, 1, 1, b[4]);
    for (const x of [3, 12]) p.rect(x, y0 + 4, 3, 1, b[4]);
  } else {
    for (const [x, y] of [
      [4, 4],
      [13, 9],
      [8, 15],
    ] as const)
      p.rect(x, y, 3, 1, b[3]);
  }
  return p;
}

/** A shut trap door: a wooden lid with a red frame and a ring to pull it by. */
function hatch(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.r('wood');
  const r = pal.r('red');
  const s = pal.r('stone');
  p.rect(0, 6, 20, 14, r[2]).rect(2, 8, 16, 10, w[3]);
  for (const x of [7, 12]) p.rect(x, 8, 1, 10, w[1]);
  p.rect(2, 8, 16, 1, w[4]).rect(2, 17, 16, 1, w[1]).rect(0, 6, 20, 1, r[4]);
  p.rect(8, 11, 4, 4, s[4]).rect(9, 12, 2, 2, w[1]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** An open trap door: a dark hole in a red frame. */
function hatchOpen(pal: Pal): Pixels {
  const p = new Pixels(20, 20, pal.c('ink', 0));
  const r = pal.r('red');
  const w = pal.r('wood');
  p.rect(0, 0, 20, 2, r[2]).rect(0, 0, 2, 20, r[2]).rect(18, 0, 2, 20, r[2]);
  p.rect(0, 0, 20, 1, r[4]);
  for (const y of [7, 14]) p.rect(5, y, 10, 1, w[1]);
  return p;
}

/** A hole in the ground under the hatch: dark earth. */
function cave(pal: Pal): Pixels {
  const p = new Pixels(20, 20, pal.c('ink', 0));
  const d = pal.r('dirt');
  p.rect(0, 0, 2, 20, d[2]).rect(18, 0, 2, 20, d[2]);
  for (const [x, y] of [
    [6, 5],
    [12, 12],
    [8, 17],
  ] as const)
    p.rect(x, y, 3, 1, d[1]);
  return p;
}

/** Adds the wire blocks to `book` (after addStarterBlocks and the signs). */
export function addWireBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('leverRedOn', lever(pal, 'red', true), air);
  book.add('leverBlueOn', lever(pal, 'blue', true), air);
  book.add('leverRed', lever(pal, 'red', false), { ...air, effect: ONE, eamt: HALF, touch: 'leverRedOn' });
  book.add('leverBlue', lever(pal, 'blue', false), { ...air, effect: TWO, eamt: HALF, touch: 'leverBlueOn' });
  book.add('leverHatch', lever(pal, 'red', false), { ...air, effect: HATCH, eamt: HATCH_CELLS, touch: 'leverRedOn' });
  book.add('ghostRed', ghost(pal, 'red'), { ...air, effect: ONE, eamt: -1, touch: 'plank' });
  book.add('ghostBlue', ghost(pal, 'blue'), { ...air, effect: TWO, eamt: -1, touch: 'plank' });
  book.add('poolTop', pool(pal, true), air);
  book.add('pool', pool(pal, false), air);
  book.add('hatchOpen', hatchOpen(pal), air);
  book.add('cave', cave(pal), air);
  book.add('hatch', hatch(pal), { solid: SOLID, grav: PULL.down, effect: HATCH, eamt: -1, touch: 'hatchOpen' });
}
