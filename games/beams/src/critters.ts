// The monsters of BEAMS AND FOG. Their pictures have clear pixels (color 255), and that is the whole trick: where a monster's picture is
// clear, whatever is behind it shows. A glow or a puff of fog is a monster whose picture is mostly clear, with light painted in a
// checkerboard. (A background block can't do this; it has no clear pixels. That is why beams and fog over the ground are blocks
// painted over twins of the ground, and a thing that moves is a monster.)
//   lamp0..2   a floating lantern with a halo: solid, a checkerboard, or three densities in rings (level 3)
//   puff       a puff of fog, a monster. Three of them side by side are a bank of fog that drifts (level 2).
// Nothing here hurts: the blocks are not solid and take no hit points away.
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { clearVeil, type Density } from './light';

const T = 255;
/** Pixels a monster moves at a time (a speed of 2 moves it 2, 4, 6... pixels a step, never an odd number). Its checkerboard then keeps the same phase against the hills' and the wall's, so where the two overlap it can't blink between dots and solid. */
const STEP = 2;

/** The monsters by number (their place in the .MON file). Each is its own so the signs can stand beside each. */
export const CRITTER = { lampSolid: 0, lampDither: 1, lampSoft: 2, puffFar: 3, puffNear: 4 } as const;

/** The halo's rings, inside out: [radius, density]. Pixels beyond the last radius are clear. */
export const HALO = {
  solid: [[9.5, 100]],
  dither: [[9.5, 50]],
  soft: [
    [4.5, 75],
    [7, 50],
    [9.5, 25],
  ],
} as const satisfies Record<string, readonly (readonly [number, Density])[]>;
export type Halo = keyof typeof HALO;

/** The color a monster's light is painted in. */
const glow = (pal: Pal): number => pal.c('gold', 4);

/** The halo alone: its painted pixels in `color`, the rest clear. */
export function haloPicture(pal: Pal, halo: Halo, color = glow(pal)): Pixels {
  const rings = HALO[halo];
  const p = new Pixels(20, 20, T);
  for (const [r, d] of [...rings].reverse()) {
    const part = clearVeil(20, 20, d, color, (x, y) => (x - 9.5) ** 2 + (y - 9.5) ** 2 <= r * r);
    p.blit(part, 0, 0, T);
  }
  return p;
}

/** A little lantern, drawn over its halo: a dark frame, a bright bulb, a ring on top. */
export function lampPicture(pal: Pal, halo: Halo, mark?: number): Pixels {
  const { c } = pal;
  const p = haloPicture(pal, halo, mark);
  p.rect(7, 6, 6, 1, c('ink', 0)).rect(9, 4, 2, 2, c('ink', 0));
  p.rect(6, 7, 8, 7, c('ink', 0)).rect(7, 8, 6, 5, pal.c('gold', 3)).rect(8, 9, 4, 3, c('white', 3));
  p.rect(7, 14, 6, 1, c('ink', 0));
  return p;
}

/** A puff of fog: an oval of fog color, three densities (thick middle, thin edge), the rest clear. */
export function puffPicture(pal: Pal, mark?: number): Pixels {
  const color = mark ?? pal.c('white', 3);
  const p = new Pixels(20, 20, T);
  for (const [k, d] of [
    [1, 25],
    [0.72, 50],
    [0.4, 75],
  ] as const) {
    const part = clearVeil(20, 20, d, color, (x, y) => ((x - 9.5) / (9.5 * k)) ** 2 + ((y - 9.5) / (5.5 * k)) ** 2 <= 1);
    p.blit(part, 0, 0, T);
  }
  return p;
}

/** The monsters' pictures (.MBL). */
export function buildCritterBlocks(pal: Pal): Book {
  const book = new Book('mbl');
  const rules = { solid: 0, hp: 0 };
  for (const h of ['solid', 'dither', 'soft'] as const) book.add(`lamp.${h}`, lampPicture(pal, h), rules);
  book.add('puff', puffPicture(pal), rules);
  return book;
}

/** What each does (.MON). The lanterns drift to and fro; the far bank of fog is slow and the near one twice as quick, always in even steps (see STEP). */
export function buildCritters(mb: Book, run = 6): Monster[] {
  const set = newMonsterSet();
  const base = { power: 150, thru: 1, end: -2 };
  for (const [id, name] of [
    [CRITTER.lampSolid, 'lamp.solid'],
    [CRITTER.lampDither, 'lamp.dither'],
    [CRITTER.lampSoft, 'lamp.soft'],
  ] as const)
    set[id] = mon([[mb.n(name), 20]], base, pace(run, STEP));
  set[CRITTER.puffFar] = mon([[mb.n('puff'), 20]], base, pace(10, STEP));
  set[CRITTER.puffNear] = mon([[mb.n('puff'), 20]], base, pace(10, STEP * 2));
  return set;
}
