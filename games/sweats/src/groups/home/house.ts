// The HOME SWEET HOME set's ramps and the house every one of its monologues starts in: the
// striped wallpaper, the baseboard row the poet walks along, the oak floorboards, the plaster
// ceiling with its crown molding, the window (the moon and the snow at night), and the pick-ups
// over them. Each monologue adds its own rooms and set pieces.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob, shadeAt } from '../../../../snowbound/src/art/draw';
import type { Pal, Ramp } from '../../art/pal';
import type { Monster } from '../../../../../web/src/formats/monster';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, loot, spotlight } from '../../common/blocks';
import { addPicture } from '../../common/picture';
import { anim, mon } from '../../common/characters';
import { T, type SpriteBook } from '../../common/sprites';
import { POWER } from '../../ids';
import { FLUFF } from './ids';

export const HOME_RAMPS: Ramp[] = [
  // the wallpaper: dusty rose with cream stripes
  ['rose', 4, [96, 56, 64], [232, 196, 190]],
  // the night outside the window, and the cold
  ['night', 4, [8, 12, 40], [110, 136, 200]],
  // the blanket and the new one: lavender, and an icy mint
  ['quilt', 4, [40, 36, 100], [190, 180, 250]],
  ['ice', 3, [100, 170, 200], [230, 250, 255]],
  // the glow of the phone, the screen of the forums (it keeps its light at night)
  ['glow', 4, [20, 40, 110], [200, 236, 255], undefined, true],
  // the couch, the armchair: a rusty corduroy
  ['couch', 4, [60, 26, 22], [196, 104, 76]],
  // the bank behind which he parks: brick, and the asphalt of the lot
  ['brick', 3, [90, 34, 26], [196, 100, 76]],
  ['asphalt', 3, [36, 36, 44], [110, 110, 120]],
  // pizza: crust and cheese
  ['crust', 3, [140, 80, 30], [244, 200, 120]],
];

/** The wallpaper: dusty rose, cream stripes, a little diamond between them. */
export function wallpaper(pal: Pal, seed: number): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20);
  const r = rng(seed);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const stripe = x % 10;
      p.set(x, y, stripe === 0 || stripe === 1 ? c('rose', 3) : stripe === 2 ? c('rose', 1) : c('rose', r() < 0.05 ? 1 : 2));
    }
  for (const [dx, dy] of [
    [6, 5],
    [6, 15],
  ])
    p.set(dx, dy - 1, c('rose', 3))
      .set(dx - 1, dy, c('rose', 3))
      .set(dx + 1, dy, c('rose', 3))
      .set(dx, dy + 1, c('rose', 3));
  return p;
}

/** The baseboard row: a chair rail, the wainscot's panels, a painted baseboard. */
export function baseboard(pal: Pal, seed: number): Pixels {
  const c = pal.c;
  const p = wallpaper(pal, seed);
  p.rect(0, 2, 20, 18, c('white', 1)).rect(0, 2, 20, 2, c('white', 2)).rect(0, 4, 20, 1, c('white', 0));
  p.frame(3, 6, 14, 7, c('white', 0)).rect(4, 7, 12, 1, c('white', 2));
  p.rect(0, 14, 20, 6, c('white', 1)).rect(0, 14, 20, 1, c('white', 2)).rect(0, 15, 20, 1, c('white', 0)).rect(0, 19, 20, 1, c('wood', 0));
  return p;
}

/** Oak floorboards, seen edge-on (`top`: the walking surface). */
export function floorboards(pal: Pal, top: boolean, seed: number): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20);
  const r = rng(seed);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('wood', top ? (r() < 0.2 ? 2 : 3) : r() < 0.25 ? 0 : 1));
  if (top) {
    p.rect(0, 0, 20, 2, c('wood', 4)).rect(0, 6, 20, 1, c('wood', 1)).rect(0, 13, 20, 1, c('wood', 1));
    p.rect(7, 2, 1, 4, c('wood', 1)).rect(15, 7, 1, 6, c('wood', 1)).rect(3, 14, 1, 6, c('wood', 1));
  }
  return p;
}

export function buildHouse(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  book.add('wall', wallpaper(pal, 1), AIR);
  book.add('wallB', baseboard(pal, 2), AIR);
  book.add('floor', floorboards(pal, true, 3), { solid: SOLID });
  book.add('slab', floorboards(pal, false, 4), { solid: SOLID });
  // the ceiling: plaster with a crown molding along its bottom
  const ceil = (lamp: boolean) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('white', (x * 3 + y * 7) % 11 === 0 ? 0 : 1));
    p.rect(0, 14, 20, 2, c('white', 2)).rect(0, 16, 20, 1, c('wood', 2)).rect(0, 17, 20, 2, c('white', 2)).rect(0, 19, 20, 1, c('rose', 1));
    for (let x = 1; x < 20; x += 4) p.set(x, 18, c('white', 0));
    if (lamp) {
      p.rect(9, 14, 2, 3, c('gold', 1));
      blob(p, 10, 19, 5, 3, R('gold'), 1, 3);
      p.rect(5, 19, 11, 1, c('gold', 0));
    }
    return p;
  };
  book.add('ceil', ceil(false), { solid: SOLID });
  book.add('ceilLamp', ceil(true), { solid: SOLID });
  // the window: the night sky, the moon, snow on the sill, the curtains drawn back
  addPicture(book, 'win', homeWindow(pal), wallpaper(pal, 5), () => AIR);
  // a shelf on the wall (a ledge: hop up through it, stand on it)
  const shelf = wallpaper(pal, 6);
  shelf.rect(0, 0, 20, 3, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 3, 20, 1, c('wood', 0));
  for (const x of [3, 15])
    shelf
      .line(x, 4, x, 10, c('metal', 1))
      .line(x, 4, x + (x < 10 ? 4 : -4), 4, c('metal', 1))
      .line(x, 10, x + (x < 10 ? 4 : -4), 4, c('metal', 0));
  book.add('shelf', shelf, { solid: LEDGE, grav: GRAV.down });
  for (const bg of ['wall', 'wallB']) loot(book, pal, bg);
  spotlight(book, pal, 'wallB');
}

/** The window onto the night (2 x 2 blocks): the moon, falling snow, a snowy sill, curtains drawn back. */
export function homeWindow(pal: Pal): Pixels {
  const c = pal.c;
  const p = new Pixels(40, 40, 255);
  p.rect(5, 2, 30, 32, c('white', 2));
  for (let y = 4; y < 32; y++) for (let x = 7; x < 33; x++) p.set(x, y, shadeAt(pal.r('night'), 0, 3, (y - 4) / 30, x, y));
  // the moon, a crescent; the snow coming down; the rooftops across the street
  p.disc(26, 10, 4, c('ice', 2)).disc(24.4, 8.8, 3.4, c('night', 0));
  const r = rng(14);
  for (let k = 0; k < 24; k++) p.set(7 + Math.floor(r() * 26), 4 + Math.floor(r() * 24), c('white', r() < 0.5 ? 2 : 1));
  p.rect(7, 26, 8, 6, c('night', 1))
    .line(7, 26, 11, 22, c('night', 1))
    .line(11, 22, 15, 26, c('night', 1))
    .rect(18, 24, 10, 8, c('night', 1))
    .rect(21, 27, 2, 2, c('gold', 2));
  p.line(7, 26, 11, 22, c('white', 2)).line(11, 22, 15, 26, c('white', 2)).rect(18, 24, 10, 1, c('white', 2));
  p.rect(19, 4, 2, 28, c('white', 1)).rect(7, 17, 26, 2, c('white', 1));
  p.rect(5, 31, 30, 3, c('ice', 2)).rect(3, 34, 34, 3, c('white', 1)).rect(3, 37, 34, 1, c('white', 0));
  // the curtains, drawn back and tied
  for (let y = 0; y < 40; y++) {
    const w = y < 20 ? 6 - Math.floor(y / 6) : 2 + Math.floor((y - 20) / 5);
    for (let x = 0; x < w; x++) {
      const k = (x + Math.floor(y / 3)) % 3 === 0 ? 1 : 2;
      p.set(x, y, c('quilt', k)).set(39 - x, y, c('quilt', k));
    }
  }
  p.rect(0, 19, 4, 2, c('gold', 2)).rect(36, 19, 4, 2, c('gold', 2));
  return p;
}

/** The sprites every monologue of the set shares: a puff of lint, where a beaten foe was. */
export function houseSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const puff = (f: number) => {
    const p = new Pixels(20, 20, T);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + f;
      p.disc(10 + Math.cos(a) * (3 + f * 3), 10 + Math.sin(a) * (3 + f * 3), 2.4 - f * 0.8, c(k % 2 ? 'white' : 'quilt', 2 + f));
    }
    return p;
  };
  book.add('fluff0', puff(0));
  book.add('fluff1', puff(1));
}

/** Fills the set's shared slot: the puff of lint (a friend, so it never hurts; gone in a moment). */
export function houseMonsters(set: Monster[], mb: SpriteBook): void {
  set[FLUFF] = mon(anim(mb, 'fluff0', 'fluff1', 3), { power: POWER.friend, thru: 0, end: 8 });
}
