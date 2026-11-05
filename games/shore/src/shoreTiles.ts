// The shore: sand tiles that have water next to them, drawn as a loop of frames in which the wave runs up the sand
// and back. A tile's shape is its key: which of the 8 cells around it are water. Every tile is drawn from one rule,
// the distance from each pixel to the nearest water cell: closer than the wave's reach is water, then a rim of foam,
// then wet sand, then dry. Where two water cells meet the tile at a corner the rule rounds the sand, and a tile that
// has water only diagonally gets a rounded bite taken out of its corner.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

/** The 8 neighbors, as bits of a key. */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;
export const NE = 16;
export const SE = 32;
export const SW = 64;
export const NW = 128;

/** How far the wave reaches into the tile in each frame (pixels); the ring goes in, out, in. */
export const REACH = [4, 8, 12, 8] as const;
/** Ticks each frame shows: the wave rushes in, rests at the top, slides back and rests at the bottom. */
export const SHORE_TICKS = [8, 5, 9, 5] as const;
/** The wet sand reaches this far, so it shows where the wave has been. */
const WET = 13;
/** How round the sand's corners are (radius, pixels). */
const ROUND = 6;

/** A key with its needless bits dropped: a diagonal water cell only matters when both of its sides are sand. */
export function normalize(key: number): number {
  let k = key;
  if (k & (N | E)) k &= ~NE;
  if (k & (S | E)) k &= ~SE;
  if (k & (S | W)) k &= ~SW;
  if (k & (N | W)) k &= ~NW;
  return k;
}

/** The distance from pixel (x, y) to the nearest water around a tile with `key`, with the sand's corners rounded by `reach`. */
function distance(key: number, x: number, y: number, reach: number): number {
  const px = x + 0.5;
  const py = y + 0.5;
  const side = { [N]: py, [E]: 20 - px, [S]: 20 - py, [W]: px } as Record<number, number>;
  let best = Infinity;
  for (const b of [N, E, S, W]) if (key & b) best = Math.min(best, side[b]);
  // two water sides that meet: the sand between them is rounded, a circle of radius ROUND that reaches the wave's own edge
  for (const [a, b] of [
    [N, E],
    [E, S],
    [S, W],
    [W, N],
  ]) {
    if (!(key & a) || !(key & b)) continue;
    const far = reach + ROUND;
    if (side[a] >= far && side[b] >= far) continue;
    best = Math.min(best, far - Math.hypot(Math.max(0, far - side[a]), Math.max(0, far - side[b])));
  }
  // a water cell only at a corner takes a round bite
  const corner: [number, number, number][] = [
    [NE, 20, 0],
    [SE, 20, 20],
    [SW, 0, 20],
    [NW, 0, 0],
  ];
  for (const [b, cx, cy] of corner) if (key & b) best = Math.min(best, Math.hypot(px - cx, py - cy));
  return best;
}

/** One frame of a shore tile: `reach` pixels of wave. */
export function shoreFrame(pal: Pal, key: number, reach: number, seed = 5): Pixels {
  const { c } = pal;
  const sand = sandTile(pal, seed);
  const p = sand.crop(0, 0, 20, 20);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const raw = distance(key, x, y, reach);
      if (raw >= WET + 2) continue; // dry sand, as drawn
      // the front is a little wavy; the wave repeats every 20 pixels, so it joins the next tile's
      const dist = raw - 1.3 * Math.sin(((x + y + 0.5) / 20) * Math.PI * 2);
      if (dist < reach - 2) p.set(x, y, c('blue', 2));
      else if (dist < reach - 1) p.set(x, y, c('blue', 4));
      else if (dist < reach) p.set(x, y, c('white', 3));
      else if (dist < reach + 1.5) p.set(x, y, c('parch', 1));
      else if (dist < WET && (dist < reach + 4 || (x + y) % 2 === 0)) p.set(x, y, c('parch', 1));
    }
  return p;
}

/** Plain dry sand: a few darker and lighter grains, the same every time. */
export function sandTile(pal: Pal, seed = 5): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('parch', 2));
  const rand = rng(seed);
  for (let i = 0; i < 18; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), i % 3 ? c('parch', 1) : c('parch', 3));
  return p;
}

/** Sand with a few small pebbles in it. */
export function pebbleTile(pal: Pal): Pixels {
  const { c } = pal;
  const p = sandTile(pal, 9);
  for (const [x, y] of [
    [4, 5],
    [13, 11],
    [8, 16],
  ] as const) {
    p.rect(x, y, 3, 2, c('stone', 2))
      .rect(x, y, 3, 1, c('stone', 3))
      .set(x + 1, y + 2, c('parch', 0));
  }
  return p;
}
