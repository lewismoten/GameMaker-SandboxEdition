// Rain is pictures, not particles: timed block rings move thin streaks down through a tile.
// PLAYGAME.C 2330-2340 remaps each block number, so copies share a clock; map starts offset the rings.
// A puddle's splash under the hero is touch blocks (PLAYGAME's touchbl): each tick he stands in a
// cell swaps it for the next picture of the splash, and the first one adds a point, which plays the
// score sound (the splash). See addStepSplash.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/** Rain moves every game tick (18 a second): five pixels down a frame, one tile in a four-frame loop. */
export const RAIN_TICKS = 1;

/** Keep hero, signs and PLAYGAME's purple text intact; cool only the scenery ramps. */
export function rainPalette(): Pal {
  const pal = buildStarterPalette(undefined, 'rain');
  const ramp = (name: string, from: number[], to: number[]) => {
    const n = pal.r(name).length;
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) pal.pal[pal.c(name, i) * 3 + k] = Math.round((from[k] + ((to[k] - from[k]) * i) / (n - 1)) / 4);
  };
  ramp('sky', [28, 42, 66], [112, 140, 160]);
  ramp('grass', [24, 56, 56], [112, 160, 144]);
  ramp('dirt', [32, 40, 52], [100, 116, 128]);
  ramp('blue', [48, 88, 128], [192, 224, 244]);
  return pal;
}

/** A second palette for the SAME map and block pictures, not a new drawing or live palette cycle. */
export function stormPalette(pal: Pal): Uint8Array {
  const out = pal.pal.slice();
  for (const name of ['sky', 'grass', 'dirt', 'stone', 'brick'])
    for (const at of pal.r(name)) for (let k = 0; k < 3; k++) out[at * 3 + k] = Math.round(out[at * 3 + k] * (k === 2 ? 0.72 : 0.52));
  return out;
}

/** One streak in a tile at frame 0: its lowest pixel (head), length, and near (bright, long) or far (dim, short). */
interface Streak {
  x: number;
  y: number;
  len: number;
  near: boolean;
}
/** One near drop and two far ones a tile, on different rows of the five-pixel step, so no two line up. */
const STREAKS: Streak[] = [
  { x: 5, y: 2, len: 6, near: true },
  { x: 15, y: 4, len: 3, near: false },
  { x: 11, y: 15, len: 3, near: false },
];

/** Where a streak's head is at `frame` (0..3): five pixels lower each frame, straight down, wrapping. */
const headY = (s: Streak, frame: number) => (s.y + frame * 5) % 20;

/** Where each streak's head is at `frame`, for pictures that stop the rain (a roof). */
export function streakHeads(frame: number): { x: number; y: number; near: boolean }[] {
  return STREAKS.map((s) => ({ x: s.x, y: headY(s, frame), near: s.near }));
}

/** A streak's pixels from its head up: a thin line leaning one pixel right for every three up, brightest at the head. */
function streakPixels(pal: Pal, s: Streak, frame: number): [number, number, number][] {
  const hy = headY(s, frame);
  const out: [number, number, number][] = [];
  for (let k = 0; k < s.len; k++) {
    const c = s.near ? pal.c('blue', k === 0 ? 4 : k < 3 ? 3 : 2) : k === 0 ? pal.c('blue', 2) : pal.c('sky', 5);
    out.push([s.x + Math.floor(k / 3), hy - k, c]);
  }
  return out;
}

/** The falling-rain picture for one frame: sky with the three streaks, wrapping at the tile edges. */
export function rainTile(pal: Pal, frame: number): Pixels {
  const p = new Pixels(20, 20, pal.c('sky', 3));
  for (const s of STREAKS) for (const [x, y, c] of streakPixels(pal, s, frame)) p.set((x + 20) % 20, (y + 20) % 20, c);
  return p;
}

/** The air just above the ground: drops stop at the grass, and the near one splashes, frame by frame after it lands. */
function landing(pal: Pal, frame: number): Pixels {
  const p = new Pixels(20, 20, pal.c('sky', 3));
  for (const s of STREAKS) {
    // In the bottom row of air a drop enters at the top and does not wrap: its tail above y 0 is in the tile above.
    for (const [x, y, c] of streakPixels(pal, s, frame)) if (y >= 0 && y <= 18) p.set(x % 20, y, c);
    if (!s.near) continue;
    // frames since this drop's head reached the bottom five rows (0: landing now)
    const since = (frame - (3 - Math.floor(s.y / 5)) + 4) % 4;
    const x = s.x;
    if (since === 0)
      p.set(x - 1, 19, pal.c('blue', 3))
        .set(x, 19, pal.c('blue', 4))
        .set(x + 1, 19, pal.c('blue', 3));
    if (since === 1) for (const d of [-1, 1]) p.set(x + d * 2, 17, pal.c('blue', 4)).set(x + d * 3, 16, pal.c('blue', 3));
    if (since === 2) {
      for (const d of [-1, 1]) p.set(x + d * 4, 18, pal.c('blue', 2));
      p.rect(x - 2, 19, 5, 1, pal.c('blue', 2));
    }
  }
  return p;
}

/** A shallow three-tile pool inset in the solid path; two rings spread from where drops land, half a loop apart. */
function puddle(pal: Pal, frame: number, part: number, ground: Pixels): Pixels {
  const wide = new Pixels(60, 20);
  for (let i = 0; i < 3; i++) wide.blit(ground, i * 20, 0);
  for (let y = 1; y < 11; y++)
    for (let x = 0; x < 60; x++) {
      const q = ((x - 29.5) / 29) ** 2 + ((y - 5.5) / 5) ** 2;
      if (q < 1) wide.set(x, y, pal.c('blue', y < 3 ? 2 : y < 6 ? 1 : 0));
      if (q >= 0.8 && q < 1) wide.set(x, y, pal.c('blue', 2));
    }
  // a faint reflection of the sky along the far edge
  for (let x = 14; x < 46; x += 3) wide.set(x, 2, pal.c('blue', 3));
  for (const [cx, at] of [
    [19, frame],
    [41, (frame + 2) % 4],
  ]) {
    const rx = 2 + at * 3;
    const ry = 0.6 + at * 0.8;
    for (let t = 0; t < 40; t++) {
      const a = (t * Math.PI) / 20;
      wide.set(cx + Math.cos(a) * rx, 6 + Math.sin(a) * ry, pal.c('blue', at < 2 ? 4 : at === 2 ? 3 : 2));
    }
  }
  return wide.crop(part * 20, 0, 20, 20);
}

/** The splash where the hero steps, in the air cell above the puddle (his feet hide the middle). */
function stepSplash(pal: Pal, stage: number): Pixels {
  const p = new Pixels(20, 20, pal.c('sky', 3));
  const white = pal.c('white', 3);
  const hi = pal.c('blue', 4);
  const mid = pal.c('blue', 3);
  const lo = pal.c('blue', 2);
  for (const side of [-1, 1]) {
    // mirrored: dx counts in from the cell's edge on each side of the feet
    const at = (dx: number, y: number, c: number) => p.set(side < 0 ? dx : 19 - dx, y, c);
    if (stage === 0) {
      // the water jumps up beside the feet in two thick fans
      for (let y = 10; y < 20; y++) {
        const dx = 5 - Math.floor((19 - y) / 2);
        at(dx, y, y < 13 ? white : hi);
        at(dx + 1, y, y < 13 ? hi : mid);
      }
      at(1, 8, white);
      at(3, 7, hi);
      for (let dx = 0; dx < 6; dx++) at(dx, 19, mid);
    } else if (stage === 1) {
      // a crown of drops flying up and out
      for (const [dx, y, c] of [
        [0, 6, white],
        [2, 3, white],
        [4, 6, hi],
        [1, 9, hi],
        [3, 11, mid],
        [0, 13, mid],
        [5, 2, hi],
      ] as const)
        at(dx, y, c);
      for (let dx = 0; dx < 6; dx++) at(dx, 18 + (dx % 2), mid);
    } else {
      // the drops fall back, and a ring spreads on the water
      for (const [dx, y, c] of [
        [0, 12, hi],
        [2, 14, mid],
        [4, 16, mid],
        [1, 17, lo],
      ] as const)
        at(dx, y, c);
      for (let dx = 0; dx < 7; dx++) at(dx, 19, dx % 3 === 0 ? white : mid);
    }
  }
  return p;
}

/**
 * The step splash, as PLAYGAME's touch blocks: each tick the hero overlaps a cell, the block there turns
 * into its touchbl. `wet` (rain, armed) adds a point, so Game-Maker plays the score sound, and becomes
 * `step.0`; six splash steps (three pictures, two ticks each) end in four `dry` rings that look like the
 * rain again, and the last one is `wet` once more. Walking past a column overlaps it 9 or 10 ticks, so one
 * walk makes one splash; standing in the puddle splashes again every 11 ticks, like stamping.
 */
function addStepSplash(book: Book, pal: Pal, timed: Timed[]): void {
  const DRY = 4;
  const air = { grav: PULL.down };
  for (let f = 0; f < 4; f++) {
    book.add(`wet.${f}`, rainTile(pal, f), { ...air, score: 1, touch: 'step.0' });
    timed.push({ name: `wet.${f}`, next: `wet.${(f + 1) % 4}`, ticks: RAIN_TICKS });
  }
  for (let i = 0; i < 6; i++) book.add(`step.${i}`, stepSplash(pal, Math.floor(i / 2)), { ...air, touch: i < 5 ? `step.${i + 1}` : 'dry0.0' });
  for (let d = 0; d < DRY; d++)
    for (let f = 0; f < 4; f++) {
      book.add(`dry${d}.${f}`, rainTile(pal, f), { ...air, touch: d < DRY - 1 ? `dry${d + 1}.0` : 'wet.0' });
      timed.push({ name: `dry${d}.${f}`, next: `dry${d}.${(f + 1) % 4}`, ticks: RAIN_TICKS });
    }
}

export function addRain(book: Book, pal: Pal, timed: Timed[], withPuddles: boolean): void {
  const ring = (base: string, draw: (f: number) => Pixels, ticks: number, solid = false) => {
    for (let f = 0; f < 4; f++) {
      book.add(`${base}.${f}`, draw(f), solid ? { solid: SOLID } : { grav: PULL.down });
      timed.push({ name: `${base}.${f}`, next: `${base}.${(f + 1) % 4}`, ticks });
    }
  };
  ring('rain', (f) => rainTile(pal, f), RAIN_TICKS);
  ring('splash', (f) => landing(pal, f), RAIN_TICKS);
  if (withPuddles) {
    for (let part = 0; part < 3; part++) ring(`pool${part}`, (f) => puddle(pal, f, part, book.pics.get('grass')!), 2, true);
    addStepSplash(book, pal, timed);
  }
}

export function finishBlocks(l: { book: Book; timed: Timed[] }) {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
