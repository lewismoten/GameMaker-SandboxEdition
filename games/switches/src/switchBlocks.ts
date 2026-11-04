// SWITCHES's own blocks, added to the Starter block set after the signs:
//   leverRed, leverRedOn     a lever: touch it and counter 22 goes up by one plank's worth (6), and it flips
//   leverBlue, leverBlueOn   the same for counter 23
//   ghostRed, ghostBlue      a plank that is not there yet: you can walk into its square (it is not solid).
//                            Touch it with the counter full enough and it turns into a real plank (the
//                            Starter set's `plank`, which you can stand on) and takes one off the counter.
//                            With the counter empty the touch is refused, so it stays a dotted outline.
//   waterTop, water          the pool under the bridge: it takes more hit points than the hero has (a life)
// The lever and the bridge never talk to each other: they only share a counter. A block changes only
// itself when touched, so "the lever opens the bridge" is really "the lever fills a counter, and each
// plank spends one". The hero's counters 22 and 23 start at 1 (a counter shows one less than it holds).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The counters: what the red lever fills and the red planks spend, then blue's. */
export const RED = 22;
export const BLUE = 23;
/** Planks in one bridge, and so what one pull of a lever adds. */
export const PLANKS = 6;
/** Hit points a pool takes: far more than the hero has, so the touch is a lost life. */
export const POOL_HURT = -200;

type Color = 'red' | 'blue';

/** A lever on a stone base: the handle leans left (waiting) or right (pulled), with a square grip in the color; the base lamp is lit when pulled. */
function lever(pal: Pal, color: Color, pulled: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  const c = pal.r(color);
  const g = pal.r('gold');
  // the shaft (three wide), then a bar-shaped grip across its top
  const tipX = pulled ? 15 : 4;
  for (const d of [-1, 0, 1]) p.line(10 + d, 13, tipX + d, 5, d === 1 ? s[1] : d === 0 ? s[3] : s[4]);
  p.rect(tipX - 3, 1, 8, 4, c[3])
    .rect(tipX - 3, 1, 8, 1, c[4])
    .rect(tipX - 3, 4, 8, 1, c[1]);
  // the base: a stone box with a lamp (lit when pulled) and a slot the shaft stands in
  p.rect(1, 13, 18, 7, s[3]).rect(1, 13, 18, 1, s[4]).rect(1, 19, 18, 1, s[1]);
  p.rect(4, 15, 6, 2, s[0]);
  p.rect(13, 15, 4, 3, pulled ? g[4] : s[1]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** A plank that is not there yet: a dotted outline of a plank in the color, with its nails. */
function ghost(pal: Pal, color: Color): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const c = pal.r(color);
  const dot = c[2];
  // a dashed outline two pixels thick, a pale fill and a dashed grain line, so it reads as a plank that is not there yet
  p.rect(1, 1, 18, 6, c[4]);
  for (let x = 0; x < 20; x += 5) {
    p.rect(x, 0, 3, 2, dot).rect(x, 6, 3, 2, dot);
  }
  for (let y = 0; y < 8; y += 4) {
    p.rect(0, y, 2, 2, dot).rect(18, y, 2, 2, dot);
  }
  for (let x = 2; x < 18; x += 4) p.rect(x, 3, 2, 1, dot);
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

/** Adds the switch blocks to `book` (after addStarterBlocks and the signs). */
export function addSwitchBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('leverRedOn', lever(pal, 'red', true), air);
  book.add('leverBlueOn', lever(pal, 'blue', true), air);
  book.add('leverRed', lever(pal, 'red', false), { ...air, effect: RED, eamt: PLANKS, touch: 'leverRedOn' });
  book.add('leverBlue', lever(pal, 'blue', false), { ...air, effect: BLUE, eamt: PLANKS, touch: 'leverBlueOn' });
  book.add('ghostRed', ghost(pal, 'red'), { ...air, effect: RED, eamt: -1, touch: 'plank' });
  book.add('ghostBlue', ghost(pal, 'blue'), { ...air, effect: BLUE, eamt: -1, touch: 'plank' });
  book.add('waterTop', pool(pal, true), { ...air, hp: POOL_HURT });
  book.add('water', pool(pal, false), { ...air, hp: POOL_HURT });
}
