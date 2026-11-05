// Level 3's fire on the hill: a big flame ring over a pile of logs, and sparks that rise from it. The sparks are rings of
// their own with their own times, so the fire and its sparks never beat together: a spark is only a bright dot that is
// lower in frame 0, higher in 1 and 2, and gone in 3 (a long rest). Three spark loops, laid so that no two next to each
// other share one.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { flame, type Shape } from './flames';

/** The big fire's frames: taller and wider than a torch's, in an order that does not grow and shrink. */
export const FIRE: Shape[] = [
  { h: 32, w: 31, lean: -4 },
  { h: 24, w: 29, lean: 4 },
  { h: 37, w: 32, lean: 2 },
  { h: 28, w: 29, lean: -5 },
];
export const FIRE_TICKS = [4, 2, 5, 3];

/** Where each spark loop's ember is in its four frames (x, y of its top left; null: not lit), and each frame's ticks. */
export const SPARKS: { path: ([number, number] | null)[]; ticks: number[] }[] = [
  {
    path: [[7, 15], [9, 9], [8, 3], null],
    ticks: [3, 4, 3, 11],
  },
  {
    path: [[12, 16], [11, 10], [13, 4], null],
    ticks: [5, 3, 4, 7],
  },
  {
    path: [[10, 12], [8, 6], [10, 1], null],
    ticks: [4, 5, 2, 13],
  },
];

/** One frame of a spark: a two pixel ember with a dim tail below it, on `bg`. */
export function sparkFrame(pal: Pal, bg: number, at: [number, number] | null): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, bg);
  if (at) {
    const [x, y] = at;
    p.set(x + 1, y + 3, c('red', 1)).set(x + 1, y + 4, c('red', 0));
    p.rect(x, y, 3, 3, c('gold', 3))
      .rect(x + 1, y, 1, 3, c('gold', 4))
      .set(x + 1, y + 1, c('gold', 5));
  }
  return p;
}

/** The logs: crossed logs in a ring of stones, 40 pixels wide (two blocks), the fire's base. */
export function logs(pal: Pal, bg: number): Pixels {
  const { c } = pal;
  const p = new Pixels(40, 20, bg);
  const log = (x: number, y: number, w: number, tilt: number) => {
    for (let i = 0; i < w; i++) p.rect(x + i, y + Math.round((i / w) * tilt), 1, 4, c('wood', 2)).set(x + i, y + Math.round((i / w) * tilt), c('wood', 3));
  };
  log(3, 3, 34, 5);
  log(3, 8, 34, -5);
  log(8, 5, 24, 0);
  p.rect(10, 0, 20, 3, c('orange', 2)).rect(13, 0, 14, 1, c('gold', 3)); // the glow where they meet
  p.rect(3, 4, 2, 4, c('wood', 1)).rect(35, 4, 2, 4, c('wood', 1));
  for (let x = 0; x < 40; x += 8) {
    // a ring of stones round the logs, with the fire above them
    p.rect(x, 12, 8, 8, c('stone', 2)).rect(x, 12, 8, 2, c('stone', 3)).rect(x, 18, 8, 2, c('stone', 0)).rect(x + 7, 12, 1, 8, c('stone', 0));
  }
  return p;
}

/** The big fire frame, 40x40 pixels (two blocks wide and two high), its base at the bottom. */
export function fireFrame(pal: Pal, bg: number, shape: Shape): Pixels {
  return flame(new Pixels(40, 40, bg), pal, shape, 20, 39);
}
