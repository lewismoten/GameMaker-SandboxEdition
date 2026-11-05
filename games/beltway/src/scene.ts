// ROUND AND ROUND's pictures, each a whole 320x200 screen painted once and cut into 20x20 blocks
// (cells that come out alike share one block).
//   drawRoad(pal)            level 1: a flatbed truck on the road, hills, trees and a rail behind it
//   stripTile(pal, strip)    one sliding strip's tile (40 pixels wide, repeating): the hills, the trees, the rail
//   drawLoop(pal)            level 2: a round track in the sky over a lawn, with a start line and a lap board
//   lamp(pal, lit)           one lap lamp
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { GROUND_ROW, HILLS, RAIL, RING, TILE, TREES, type Strip } from './view';

export const W = 320;
export const H = 200;

/** A fluffy cloud with its middle at (x, y). */
function cloud(p: Pixels, pal: Pal, x: number, y: number): void {
  const w = pal.c('white', 3);
  for (const [dx, dy, r] of [
    [-12, 2, 7],
    [-2, -3, 9],
    [10, 2, 7],
    [2, 5, 8],
  ] as const)
    p.disc(x + dx, y + dy, r, w);
  p.rect(x - 18, y + 6, 36, 3, w);
}

/** One sliding strip's tile, 40 pixels wide and 20 high for each row the strip fills; the strip's rows repeat every 40 pixels across. */
export function stripTile(pal: Pal, s: Strip): Pixels {
  const { c } = pal;
  const p = new Pixels(TILE, 20 * s.rows.length, c('sky', 4));
  if (s === HILLS) {
    // rolling blue hills: one bump a tile
    for (let x = 0; x < TILE; x++) {
      const h = 5 + Math.round(10 * (0.5 - 0.5 * Math.cos((x / TILE) * Math.PI * 2)));
      p.rect(x, 20 - h, 1, h, c('blue', 3));
    }
  } else if (s === TREES) {
    // a round tree and a bush on the lawn, in front of a blue haze
    p.rect(0, 0, TILE, 24, c('blue', 3)).rect(0, 24, TILE, 16, c('grass', 3));
    p.rect(8, 24, 5, 14, c('wood', 1)).rect(8, 24, 2, 14, c('wood', 3));
    p.disc(10, 15, 11, c('grass', 1)).disc(8, 12, 7, c('grass', 2)).disc(6, 10, 3, c('grass', 4));
    p.disc(30, 34, 6, c('grass', 1)).disc(29, 32, 4, c('grass', 2));
  } else if (s === RAIL) {
    // a stone rail on posts, on the lawn
    p.rect(0, 0, TILE, 20, c('grass', 3));
    p.rect(18, 3, 5, 17, c('stone', 2)).rect(18, 3, 1, 17, c('stone', 4)).rect(22, 3, 1, 17, c('stone', 1));
    p.rect(0, 6, TILE, 4, c('stone', 3)).rect(0, 6, TILE, 1, c('stone', 4)).rect(0, 9, TILE, 1, c('stone', 1));
  }
  return p;
}

/** A strip as it looks with its tile shifted left `offset` pixels: the whole 320 pixels of its rows. */
export function stripAt(pal: Pal, s: Strip, offset: number): Pixels {
  const tile = stripTile(pal, s);
  const out = new Pixels(W, tile.h);
  for (let x = 0; x < W; x++) out.blit(tile.crop((x + offset) % TILE, 0, 1, tile.h), x, 0);
  return out;
}

/** Level 1's scene: the truck's deck and tail board, the cab at the right, and the strips as they are at the start. */
export function drawRoad(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(W, H, c('sky', 3));
  p.rect(0, 0, W, 20, c('sky', 2)).rect(0, 20, W, 20, c('sky', 3)).rect(0, 40, W, 20, c('sky', 4));
  p.disc(60, 22, 11, c('gold', 3)).disc(60, 22, 8, c('gold', 4));
  cloud(p, pal, 236, 20);
  for (const s of [HILLS, TREES, RAIL]) p.blit(stripAt(pal, s, 0), 0, s.rows[0] * 20);
  // the field between the trees and the rail
  p.rect(0, 100, W, 60, c('grass', 3));
  p.rect(0, 100, W, 2, c('grass', 4));
  // the deck: planks along the bed with the wheels peeking below
  p.rect(0, GROUND_ROW * 20, W, 20, c('wood', 2));
  p.rect(0, GROUND_ROW * 20, W, 4, c('wood', 4)).rect(0, GROUND_ROW * 20 + 4, W, 1, c('ink', 0));
  for (let x = 0; x < W; x += 40) p.rect(x, GROUND_ROW * 20 + 5, 1, 15, c('wood', 0));
  for (const x of [70, 210]) p.disc(x, 200, 14, c('ink', 0)).disc(x, 200, 8, c('stone', 2)).disc(x, 200, 3, c('stone', 4));
  // the tail board at the left: tall planks standing on the deck
  p.rect(0, 80, 20, 100, c('wood', 2)).rect(0, 80, 20, 3, c('wood', 4)).rect(19, 80, 1, 100, c('wood', 0));
  for (let y = 100; y < 180; y += 20) p.rect(0, y, 20, 1, c('wood', 0));
  // the cab at the right: a teal box with a window, taller than Mia
  p.rect(260, 80, 60, 100, c('teal', 2));
  p.rect(260, 80, 60, 4, c('teal', 3)).rect(260, 80, 1, 100, c('teal', 3)).rect(260, 176, 60, 4, c('teal', 0));
  p.rect(268, 88, 46, 30, c('ink', 0)).rect(270, 90, 42, 26, c('sky', 3));
  p.rect(274, 92, 8, 22, c('white', 3)).rect(300, 92, 4, 22, c('white', 2));
  p.rect(260, 124, 60, 2, c('teal', 1));
  return p;
}

/** Whether a pixel at (x, y) is on the round track, and how far it is from the track's middle line. */
const ringDist = (x: number, y: number): number => Math.hypot(x - (RING.col * 20 + 10), y - (RING.row * 20 + 10)) - RING.radius;

/** Level 2's scene: a round track in the sky, the start line at its bottom, a lap board in its middle and a lawn under it. */
export function drawLoop(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(W, H, c('sky', 3));
  p.rect(0, 0, W, 40, c('sky', 2)).rect(0, 40, W, 60, c('sky', 3)).rect(0, 100, W, 40, c('sky', 4));
  cloud(p, pal, 40, 28);
  cloud(p, pal, 282, 60);
  // the lawn and the ground
  p.rect(0, 140, W, 40, c('grass', 3)).rect(0, 140, W, 2, c('grass', 4));
  p.rect(0, 180, W, 20, c('dirt', 2)).rect(0, 180, W, 5, c('grass', 3)).rect(0, 180, W, 2, c('grass', 4));
  const cx = RING.col * 20 + 10;
  const cy = RING.row * 20 + 10;
  const dashes = 24;
  for (let y = 0; y < 180; y++)
    for (let x = 0; x < W; x++) {
      const d = ringDist(x, y);
      const a = Math.abs(d);
      if (a > RING.half) continue;
      if (a >= RING.half - 1) p.set(x, y, c('ink', 0));
      else if (a >= RING.half - 3) p.set(x, y, c('white', 3));
      else if (a <= 1 && Math.floor(((Math.atan2(y - cy, x - cx) + Math.PI) / (Math.PI * 2)) * dashes) % 2 === 0) p.set(x, y, c('gold', 3));
      else p.set(x, y, c('stone', 1));
    }
  // the start line across the bottom of the track: checkers
  const x0 = cx - 4;
  const y0 = cy + RING.radius - RING.half + 3;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 5; j++) p.rect(x0 + i * 4, y0 + j * 4, 4, 4, (i + j) % 2 ? c('white', 3) : c('ink', 0));
  // the lap board in the middle: a label over a dark panel, three lamps cut into it
  text(p, cx - 12, cy - 30, 'LAPS', c('ink', 0));
  p.rect(cx - 30, cy - 10, 60, 20, c('ink', 1));
  return p;
}

/** A lap lamp (one block): a dark panel with a round bulb, dim or lit. */
export function lamp(pal: Pal, lit: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('ink', 1));
  p.disc(10, 10, 7, lit ? c('gold', 3) : c('stone', 0));
  if (lit) p.disc(10, 10, 4, c('gold', 5)).set(7, 7, c('white', 3));
  else p.disc(10, 10, 5, c('ink', 0));
  p.ring(10, 10, 7, c('ink', 0));
  return p;
}
