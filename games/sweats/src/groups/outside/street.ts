// The INTO THE WILD set's ramps and the street two of its monologues share (the receipt chase and
// the umbrella's odyssey): the sky (drawn in the scene's own sky ramp, so a dull Thursday and a
// downpour light the same blocks differently), the town on the skyline, the low hedge along the
// sidewalk, the street lamp, and the gusts that blow back along the street (next/ntime turns
// them on and off: gravity down and to the left while they blow).
import { Pixels, rng } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import type { Pal, Ramp } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, drawCoin, loot, spotlight } from '../../common/blocks';
import { T, type SpriteBook } from '../../common/sprites';
import { MONEY } from '../../ids';

export const OUTSIDE_RAMPS: Ramp[] = [
  ['asphalt', 3, [36, 36, 44], [112, 112, 122]],
  ['concrete', 3, [112, 106, 98], [214, 208, 196]],
  ['van', 3, [40, 70, 120], [150, 190, 236]],
  ['glass', 3, [50, 96, 120], [190, 236, 244]],
  ['brick2', 3, [104, 46, 36], [204, 116, 84]],
  ['grime', 4, [64, 58, 28], [196, 186, 120]],
  ['lino', 3, [86, 78, 58], [204, 196, 164]],
  ['neonP', 3, [170, 20, 150], [255, 150, 240], undefined, true],
  ['neonC', 3, [10, 140, 170], [150, 250, 255], undefined, true],
  ['haunt', 4, [22, 14, 32], [104, 82, 124]],
  ['fog', 3, [120, 128, 140], [226, 232, 240]],
  ['orange', 3, [150, 60, 10], [255, 176, 64]],
  ['exit', 2, [210, 24, 24], [255, 130, 110], undefined, true],
  ['fluor2', 2, [200, 236, 228], [255, 255, 250], undefined, true],
  ['drop', 2, [110, 140, 200], [210, 228, 255]],
  ['soil', 3, [46, 30, 18], [120, 84, 52]],
];

/** Ticks a gust blows, and the calm between gusts. */
export const GUST_ON = 10;
export const GUST_OFF = 36;

/** A plain patch of the scene's sky (shade k, a few specks). */
export function skyAt(pal: Pal, seed: number, k: number): Pixels {
  const p = new Pixels(20, 20, pal.c('sky', k));
  const r = rng(seed);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), pal.c('sky', k + (r() < 0.5 ? 1 : -1)));
  return p;
}

/** The far side of town along the horizon: roofs, a water tower, a steeple (they tile). */
export function skylineAt(pal: Pal, seed: number): Pixels {
  const c = pal.c;
  const p = skyAt(pal, seed, 4);
  const far = c('sky', 2);
  const win = c('sky', 3);
  p.rect(0, 9, 7, 11, far).rect(7, 14, 6, 6, far).rect(13, 6, 5, 14, far).rect(18, 11, 2, 9, far);
  p.line(15, 2, 15, 6, far).rect(14, 3, 3, 1, far);
  p.rect(8, 10, 4, 2, far).rect(9, 12, 1, 2, far).rect(11, 12, 1, 2, far);
  for (const [x, y] of [
    [2, 12],
    [4, 12],
    [2, 16],
    [14, 9],
    [16, 9],
    [14, 13],
    [16, 17],
    [9, 17],
  ])
    p.set(x, y, win);
  return p;
}

/** The walking row: the town's walls behind a low hedge along the sidewalk. */
export function townAt(pal: Pal, seed: number): Pixels {
  const c = pal.c;
  const p = new Pixels(20, 20, c('sky', 2));
  const r = rng(seed);
  p.rect(7, 0, 6, 12, c('sky', 1)).rect(18, 0, 2, 12, c('sky', 1));
  for (const [x, y] of [
    [2, 2],
    [4, 2],
    [2, 6],
    [14, 1],
    [16, 1],
    [14, 5],
    [16, 5],
    [9, 3],
    [11, 3],
  ])
    p.rect(x, y, 1, 2, c('sky', 3));
  for (let x = -2; x < 22; x += 5) blob(p, x + 2, 15, 3.6, 3.4, pal.r('green'), 0, 3);
  p.rect(0, 17, 20, 3, c('green', 0));
  for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 20), 12 + Math.floor(r() * 6), c('green', 2));
  return p;
}

/** A coin (only) over a backdrop, for the places loot() would add more than a scene needs. */
export function coinOn(book: BlockBook, pal: Pal, bg: string): void {
  const pic = book.pics.get(bg);
  if (!pic) throw new Error(`No backdrop ${bg}`);
  book.add(`coin@${bg}`, drawCoin(pic.crop(0, 0, 20, 20), pal), { ...AIR, effect: MONEY, eamt: 1, score: 10, touch: bg });
}

export function buildStreet(book: BlockBook, pal: Pal): void {
  const c = pal.c;
  book.add(
    'soil',
    (() => {
      const p = new Pixels(20, 20, c('soil', 1));
      const r = rng(40);
      for (let i = 0; i < 40; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('soil', r() < 0.5 ? 0 : 2));
      return p;
    })(),
    { solid: SOLID },
  );
  book.add('skyHi', skyAt(pal, 41, 2), AIR);
  book.add('sky', skyAt(pal, 42, 3), AIR);
  book.add(
    'skyMid',
    skyAt(pal, 48, 2).map((x, y, v) => (y > 4 && (x * 7 + y * 3) % 16 < y - 4 ? c('sky', 3) : v)),
    AIR,
  );
  book.add('skyline', skylineAt(pal, 43), AIR);
  book.add('town', townAt(pal, 44), AIR);
  // the sidewalk: slabs of concrete with their seams and the curb's lip
  const walk = new Pixels(20, 20, c('concrete', 1));
  walk.rect(0, 0, 20, 2, c('concrete', 2)).rect(0, 2, 20, 1, c('concrete', 0)).rect(9, 3, 1, 17, c('concrete', 0));
  const rw = rng(45);
  for (let i = 0; i < 18; i++) walk.set(Math.floor(rw() * 20), 3 + Math.floor(rw() * 17), c('concrete', rw() < 0.5 ? 0 : 2));
  book.add('walk', walk, { solid: SOLID });
  // the street lamp: its head (stand on it) and its pole
  const head = skylineAt(pal, 46);
  head.rect(2, 8, 16, 3, c('metal', 0)).rect(3, 7, 14, 1, c('metal', 1)).rect(5, 11, 10, 3, c('gold', 3)).rect(6, 14, 8, 1, c('gold', 2));
  head.rect(9, 15, 2, 5, c('metal', 0)).rect(9, 15, 1, 5, c('metal', 1));
  book.add('lampHead', head, { solid: LEDGE, grav: GRAV.down });
  const pole = townAt(pal, 47);
  pole.rect(9, 0, 2, 18, c('metal', 0)).rect(9, 0, 1, 18, c('metal', 1)).rect(7, 17, 6, 3, c('metal', 0));
  book.add('lampPole', pole, AIR);
  // the gusts: wind streaks blowing back along the street, then calm (the calm looks like the rest)
  const streaks = (p: Pixels, f: number) => {
    for (let k = 0; k < 3; k++)
      for (let x = 0; x < 20; x++) if ((x + k * 7 + f * 3) % 20 < 10) p.set(x, 3 + k * 6 + Math.round(Math.sin((x + k * 3) / 3)), c('white', x % 3 ? 2 : 1));
    return p;
  };
  const blow = GRAV.down | GRAV.left;
  book.add('calmLine', skylineAt(pal, 43), { grav: GRAV.down, next: 'gustLine', ntime: GUST_OFF });
  book.add('gustLine', streaks(skylineAt(pal, 43), 0), { grav: blow, next: 'calmLine', ntime: GUST_ON });
  book.add('calmTown', townAt(pal, 44), { grav: GRAV.down, next: 'gustTown', ntime: GUST_OFF });
  book.add('gustTown', streaks(townAt(pal, 44), 1), { grav: blow, next: 'calmTown', ntime: GUST_ON });
  // tips along the sidewalk, a coin up in the air, the spotlight on the pavement
  loot(book, pal, 'town');
  coinOn(book, pal, 'sky');
  spotlight(book, pal, 'town');
}

/** The puff every scattered foe of the set leaves (both frames). */
export function streetSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const puff = (f: number) => {
    const p = new Pixels(20, 20, T);
    for (let k = 0; k < 7; k++) p.disc(10 + Math.cos(k * 0.9) * (3 + f * 3), 11 + Math.sin(k * 0.9) * (2.5 + f * 2.5), 2.4 - f * 0.8, c('white', 2 - f));
    if (!f) p.disc(10, 11, 2.5, c('white', 2));
    return p;
  };
  book.add('poof0', puff(0));
  book.add('poof1', puff(1));
}
