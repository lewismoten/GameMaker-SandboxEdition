// SLOW COMPUTERS' pictures: the two sound pads (a short one and a long one, each also drawn pressed)
// and the breeze, a sky whose pale wisps drift a little every tick. Everything is gentle: the wisps are
// only a step lighter than the sky, so the whole screen changing each tick is not a flash.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { BREEZE_FRAMES } from './timing';

/**
 * A sound pad on the ground: a flat plate with a bar on its face as long as its sound (a short green one, a long
 * orange one). `pressed` sits lower, in darker colors: the pad has just played and is resting.
 */
export function pad(pal: Pal, kind: 'short' | 'long', pressed: boolean): Pixels {
  const { c, r } = pal;
  const ramp = r(kind === 'short' ? 'green' : 'orange');
  const p = new Pixels(20, 20, skyOf(pal));
  const top = pressed ? 16 : 11;
  const shade = pressed ? 1 : 2;
  p.rect(0, top, 20, 20 - top, c('ink', 0));
  p.rect(1, top + 1, 18, 19 - top, ramp[shade]);
  p.rect(1, top + 1, 18, 2, ramp[shade + 1]);
  if (!pressed) {
    const len = kind === 'short' ? 4 : 14;
    const x = Math.round((20 - len) / 2);
    p.rect(x, top + 4, len, 3, c('ink', 0));
    p.rect(x + 1, top + 5, Math.max(1, len - 2), 1, ramp[4]);
  }
  return p;
}

/** Warm, quiet rock behind a cutaway cave; lamps are scenery, never collision. */
export function cave(pal: Pal, lamp: boolean): Pixels {
  const p = new Pixels(20, 20, pal.c('stone', 0));
  p.rect(0, 0, 20, 1, pal.c('ink', 1));
  p.rect(0, 10, 20, 1, pal.c('ink', 1));
  p.rect(5, 1, 1, 9, pal.c('ink', 1));
  p.rect(15, 11, 1, 9, pal.c('ink', 1));
  if (lamp) {
    p.disc(10, 11, 8, pal.c('dirt', 1));
    p.disc(10, 11, 5, pal.c('dirt', 2));
    p.rect(8, 0, 4, 6, pal.c('wood', 0));
    p.rect(7, 6, 6, 9, pal.c('ink', 0));
    p.rect(8, 7, 4, 6, pal.c('gold', 3));
    p.rect(9, 8, 2, 4, pal.c('gold', 5));
    p.rect(7, 15, 6, 1, pal.c('wood', 0));
  }
  return p;
}

/** One frame of the breeze: three short pale wisps in a sky tile, each a few pixels further right each tick (they wrap round). */
export function breeze(pal: Pal, frame: number): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const wisp = pal.c('sky', 4);
  const pale = pal.c('sky', 5);
  const step = 20 / BREEZE_FRAMES;
  // [row, where it starts, how long]
  for (const [y, x0, len] of [
    [3, 2, 7],
    [10, 11, 5],
    [16, 6, 8],
  ]) {
    for (let i = 0; i < len; i++) {
      const x = (Math.round(x0 + frame * step) + i) % 20;
      p.set(x, y, i === len - 1 ? pale : wisp);
    }
  }
  return p;
}
