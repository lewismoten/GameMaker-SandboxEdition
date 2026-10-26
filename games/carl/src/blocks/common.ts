// What both block sets share: Game-Maker's block attributes as Carl's world uses them. A fly
// doesn't fall: while he has sugar, Carl hovers wherever he stops. Fresh open air costs a sugar
// the first time he flies into it (the money counter, refused at 0, the way Calimero II's sky
// costs its flight counter) and pulls him down when he has none; the floor gives a lick of sugar
// now and then, and sugar cubes give a lot. The gusts in the backyard push him (gravity to the
// left, coming and going).
import { Pixels } from '../../../kit/pixels';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import type { Pal } from '../art/pal';

export { BlockBook, SOLID };
/** Solid on top only: land on it, fly up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;
/** Open air: no gravity (a fly hovers). */
export const AIR = { grav: GRAV.none } as const;
/** The lives counter (an extra life). */
export const LIFE = 1;

/** The money counter: Carl's sugar (F2 shows it as Money, one less than the counter). */
export const SUGAR = 3;
/**
 * Fresh open air: the first touch takes one sugar and turns the cell into its flown twin (`twin`,
 * the same picture, free). With no sugar left PLAYGAME refuses the touch, the cell stays fresh,
 * and its gravity pulls Carl down: a tired fly sinks.
 */
export const fresh = (twin: string) => ({ grav: GRAV.down, effect: SUGAR, eamt: -1, touch: twin }) as const;
/** Ticks a floor's crumbs take to come back after a lick (it gives one sugar a lick). */
export const LICK_EVERY = 5;
/** Sugar a sugar cube gives. */
export const SUGAR_CUBE = 25;

/** A sugar cube drawn over a background block. */
export function sugarCube(p: Pixels, pal: Pal): Pixels {
  const { c } = pal;
  const x0 = 5;
  const y0 = 8;
  // the top face (lit), the front, the side (shaded), grains and a glint
  for (let i = 0; i < 3; i++) p.rect(x0 + 3 - i, y0 + i, 9, 1, c('white', 3));
  p.rect(x0, y0 + 3, 9, 8, c('white', 2))
    .rect(x0 + 9, y0 + 1, 2, 9, c('gray', 2))
    .set(x0 + 9, y0 + 10, c('gray', 2));
  p.rect(x0, y0 + 11, 11, 1, c('gray', 1));
  for (const [x, y] of [
    [2, 5],
    [5, 8],
    [7, 4],
    [3, 9],
  ])
    p.set(x0 + x, y0 + y, c('white', 3));
  p.set(x0 + 4, y0 + 1, c('white', 3))
    .set(x0 + 13, y0 - 2, c('white', 3))
    .set(x0 + 12, y0 - 3, c('white', 2))
    .set(x0 + 14, y0 - 3, c('white', 2));
  return p;
}
