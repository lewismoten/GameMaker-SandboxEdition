// The monsters of BEAMS AND FOG. Their pictures have clear pixels (color 255), and that is the whole trick: where a monster's picture is
// clear, whatever is behind it shows. A glow or a puff of fog is a monster whose picture is mostly clear, with light painted in a
// checkerboard. (A background block can't do this; it has no clear pixels. That is why beams and fog over the ground are blocks
// painted over twins of the ground, and a thing that moves is a monster.)
//   lamps      a floating lantern with a halo 60x60 wide, a group of 3x3 monsters that drift together: solid, a checkerboard, or three densities in rings (level 3)
//   puff       a puff of fog, a monster. Three of them side by side are a bank of fog that drifts (level 2).
// Nothing here hurts: the blocks are not solid and take no hit points away.
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { clearVeil, type Density } from './light';

const T = 255;
/** Pixels a monster moves at a time (a speed of 2 moves it 2, 4, 6... pixels a step, never an odd number). Its checkerboard then keeps the same phase against the hills' and the wall's, so where the two overlap it can't blink between dots and solid. */
const STEP = 2;

/** A lantern's glow is a group of 3x3 monsters (each a 20x20 piece of one 60x60 picture) that drift together; the lantern hangs in the middle one. */
export const GROUP = 3;
const SPAN = GROUP * 20;

/** The monsters by number (their place in the .MON file): the two puffs, then 9 pieces (row by row) for each glow. */
export const CRITTER = { puffFar: 0, puffNear: 1, lampSolid: 2, lampDither: 11, lampSoft: 20 } as const;
export const HALOS = ['solid', 'dither', 'soft'] as const;
/** The monster number of piece (tx, ty) of a glow. */
export const lampPiece = (halo: Halo, tx: number, ty: number): number =>
  CRITTER[`lamp${halo === 'solid' ? 'Solid' : halo === 'dither' ? 'Dither' : 'Soft'}`] + ty * GROUP + tx;

/** The halo's rings, inside out: [radius, density], on the 60x60 picture. Pixels beyond the last radius are clear. */
export const HALO = {
  solid: [[29.5, 100]],
  dither: [[29.5, 50]],
  soft: [
    [14, 75],
    [21.5, 50],
    [29.5, 25],
  ],
} as const satisfies Record<string, readonly (readonly [number, Density])[]>;
export type Halo = keyof typeof HALO;

/** The color a monster's light is painted in. */
const glow = (pal: Pal): number => pal.c('gold', 4);

/** The halo alone (60x60, or a third of that for the title's small lantern): its painted pixels in `color`, the rest clear. */
export function haloPicture(pal: Pal, halo: Halo, color = glow(pal), size = SPAN): Pixels {
  const rings = HALO[halo];
  const k = size / SPAN;
  const mid = (size - 1) / 2;
  const p = new Pixels(size, size, T);
  for (const [r, d] of [...rings].reverse()) {
    const part = clearVeil(size, size, d, color, (x, y) => (x - mid) ** 2 + (y - mid) ** 2 <= (r * k) ** 2);
    p.blit(part, 0, 0, T);
  }
  return p;
}

/** A little lantern, drawn in the middle of its halo (60x60): a dark frame, a bright bulb, a ring on top. */
export function lampPicture(pal: Pal, halo: Halo, mark?: number, size = SPAN): Pixels {
  const { c } = pal;
  const p = haloPicture(pal, halo, mark, size);
  const o = (size - 20) / 2;
  p.rect(o + 7, o + 6, 6, 1, c('ink', 0)).rect(o + 9, o + 4, 2, 2, c('ink', 0));
  p.rect(o + 6, o + 7, 8, 7, c('ink', 0))
    .rect(o + 7, o + 8, 6, 5, pal.c('gold', 3))
    .rect(o + 8, o + 9, 4, 3, c('white', 3));
  p.rect(o + 7, o + 14, 6, 1, c('ink', 0));
  return p;
}

/** One 20x20 piece of a glow. */
export function lampPiece20(pal: Pal, halo: Halo, tx: number, ty: number): Pixels {
  const whole = lampPicture(pal, halo);
  const p = new Pixels(20, 20, T);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, whole.get(tx * 20 + x, ty * 20 + y));
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
  book.add('puff', puffPicture(pal), rules);
  for (const h of HALOS)
    for (let ty = 0; ty < GROUP; ty++) for (let tx = 0; tx < GROUP; tx++) book.add(`lamp.${h}.${tx}${ty}`, lampPiece20(pal, h, tx, ty), rules);
  return book;
}

/** What each does (.MON). The lanterns drift to and fro; the far bank of fog is slow and the near one twice as quick, always in even steps (see STEP). */
export function buildCritters(mb: Book, run = 6): Monster[] {
  const set = newMonsterSet();
  const base = { power: 150, thru: 1, end: -2 };
  for (const h of HALOS)
    for (let ty = 0; ty < GROUP; ty++)
      for (let tx = 0; tx < GROUP; tx++)
        set[lampPiece(h, tx, ty)] = mon([[mb.n(`lamp.${h}.${tx}${ty}`), 20]], base, [corner(0, 0, STEP), corner(run, 0, STEP, 0), corner(0, 0, STEP, 0)]); // never turned round: a turned piece would show its own mirror image
  set[CRITTER.puffFar] = mon([[mb.n('puff'), 20]], base, pace(10, STEP));
  set[CRITTER.puffNear] = mon([[mb.n('puff'), 20]], base, pace(10, STEP * 2));
  return set;
}
