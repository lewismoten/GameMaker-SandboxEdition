// The fireflies: monsters whose pictures are mostly clear pixels (color 255), so the sky shows round them. A firefly's glow is
// a few frames of one picture (dark, an ember, dim, bright) and its blink is the monster's picture list: each frame with the
// ticks it stays up, a long dark and then a quick flash, round and round. Its drift is the monster's path, a loop of corners a
// block or two apart.
//
// The game keeps one clock for each monster on the map, but every monster starts at the same tick, at its first frame and its
// first corner. So copies of one monster blink and fly in step for ever: level 1 shows six of them. A meadow that looks alive
// is made of many monsters, each with its own times and its own path, and a firefly next to another is never the same kind.
import { newMonsterSet, type March, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** The glow's frames, darkest first. */
export const FRAMES = ['dark', 'ember', 'dim', 'bright'] as const;
export type Frame = (typeof FRAMES)[number];

/** Whether pixel (x, y) is painted at a density (percent of a 2x2 square): the dots that let the sky show through a glow. */
export function painted(density: 25 | 50 | 75 | 100, x: number, y: number): boolean {
  if (density === 100) return true;
  if (density === 50) return (x + y) % 2 === 0;
  if (density === 25) return x % 2 === 0 && y % 2 === 0;
  return !(x % 2 === 1 && y % 2 === 1);
}

/** The glow's rings for each frame, inside out: [radius, glow shade, density]. Pixels beyond the last ring stay clear. */
const RINGS: Record<Frame, [number, number, 25 | 50 | 75 | 100][]> = {
  dark: [],
  ember: [[1.2, 1, 100]],
  dim: [
    [1.2, 3, 100],
    [2.7, 2, 50],
    [4.2, 1, 25],
  ],
  bright: [
    [1.2, 4, 100],
    [2.4, 3, 100],
    [4, 2, 75],
    [6.2, 2, 25],
    [8.6, 1, 25],
  ],
};

/** The middle of the glow (the firefly's tail) in its 20x20 picture. */
const CX = 9.5;
const CY = 10.5;

/**
 * One frame of a firefly: the glow's rings (outer ones first, so inner ones paint over them) and the little dark body, head up.
 * `mark` paints the glow in one color, for the manual's pictures.
 */
export function fireflyFrame(pal: Pal, frame: Frame, mark?: number): Pixels {
  const p = new Pixels(20, 20, T);
  for (const [r, shade, d] of [...RINGS[frame]].reverse())
    p.map((x, y, c) => ((x + 0.5 - CX) ** 2 + (y + 0.5 - CY) ** 2 <= r * r && painted(d, x, y) ? (mark ?? pal.c('glow', shade)) : c));
  const body = pal.c('ink', 0);
  p.set(9, 8, body).set(10, 8, body); // the head and the front of the body, above the glowing tail
  if (frame === 'dark') p.set(9, 9, pal.c('ink', 1)).set(10, 9, pal.c('ink', 1)); // the tail, unlit
  if (frame === 'dark' || frame === 'ember') p.set(8, 8, pal.c('far', 1)).set(11, 8, pal.c('far', 1)); // the wings, folded, seen only when the tail is not bright
  return p;
}

/** The monsters' pictures (.MBL): the four frames, nothing solid and nothing that hurts. */
export function buildBugBlocks(pal: Pal): Book {
  const book = new Book('mbl');
  for (const f of FRAMES) book.add(`bug.${f}`, fireflyFrame(pal, f), { solid: 0, hp: 0 });
  return book;
}

/**
 * A kind of firefly: how long it stays dark between flashes, how long the flash is brightest, whether it flashes twice (and
 * the dark between the two), when it first flashes, and its path.
 */
export interface Kind {
  dark: number;
  bright: number;
  twice?: number;
  /** Ticks until its first flash when the level starts (less than its dark): the kinds' first flashes are spread out, so they never start together. */
  first: number;
  /** The corners of its loop, in blocks from where it starts; the last is (0, 0), home. */
  path: [number, number][];
}

/** A flash: an ember, dim, bright for `bright` ticks, dim, an ember fading out (about a second and a half all told). */
const flash = (bright: number): [Frame, number][] => [
  ['ember', 3],
  ['dim', 3],
  ['bright', bright],
  ['dim', 4],
  ['ember', 5],
];

/** A kind's picture list: [frame, ticks] in order: dark until its first flash, the flash (or two), then the rest of its dark. */
export function blinkOf(k: Kind): [Frame, number][] {
  const out: [Frame, number][] = [['dark', k.first], ...flash(k.bright)];
  if (k.twice) out.push(['dark', k.twice], ...flash(k.bright));
  if (k.dark > k.first) out.push(['dark', k.dark - k.first]);
  return out;
}

/** Ticks one round of a kind's blink takes. */
export const roundOf = (k: Kind): number => blinkOf(k).reduce((t, [, n]) => t + n, 0);

/** Level 1's first six fireflies: copies of this one kind, so they blink and fly as one. */
export const STEP: Kind = {
  dark: 44,
  bright: 5,
  first: 44,
  path: [
    [1, -1],
    [3, -1],
    [4, 0],
    [3, 1],
    [1, 1],
    [0, 0],
  ],
};

/** The ten kinds of the meadow: each with its own dark, flash and path. Their rounds (52 to 109 ticks) are all different, so they drift past one another and never line up for long. */
export const KINDS: Kind[] = [
  {
    dark: 46,
    bright: 5,
    first: 8,
    path: [
      [1, -1],
      [3, -1],
      [4, 0],
      [3, 1],
      [1, 1],
      [0, 0],
    ],
  },
  {
    dark: 62,
    bright: 4,
    twice: 9,
    first: 48,
    path: [
      [-1, -1],
      [-2, -1],
      [-3, 0],
      [-2, 1],
      [0, 1],
      [1, 0],
      [0, 0],
    ],
  },
  {
    dark: 36,
    bright: 6,
    first: 27,
    path: [
      [1, -2],
      [2, -1],
      [1, 0],
      [2, 1],
      [0, 1],
      [-1, 0],
      [0, 0],
    ],
  },
  {
    dark: 72,
    bright: 5,
    twice: 7,
    first: 66,
    path: [
      [2, 0],
      [3, -1],
      [2, -2],
      [0, -2],
      [-1, -1],
      [0, 0],
    ],
  },
  {
    dark: 53,
    bright: 7,
    first: 40,
    path: [
      [-2, -1],
      [-1, -2],
      [1, -1],
      [2, 0],
      [1, 1],
      [-1, 1],
      [0, 0],
    ],
  },
  {
    dark: 42,
    bright: 4,
    twice: 11,
    first: 15,
    path: [
      [1, 1],
      [3, 0],
      [4, -1],
      [2, -1],
      [1, -2],
      [0, 0],
    ],
  },
  {
    dark: 66,
    bright: 6,
    first: 56,
    path: [
      [-1, 1],
      [-3, 1],
      [-4, 0],
      [-3, -1],
      [-1, -1],
      [0, 0],
    ],
  },
  {
    dark: 50,
    bright: 5,
    first: 36,
    path: [
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-1, 0],
      [0, 0],
    ],
  },
  {
    dark: 58,
    bright: 3,
    twice: 8,
    first: 42,
    path: [
      [1, -1],
      [0, -2],
      [1, -3],
      [2, -2],
      [3, -1],
      [2, 0],
      [0, 0],
    ],
  },
  {
    dark: 39,
    bright: 6,
    first: 3,
    path: [
      [-1, -1],
      [0, -2],
      [2, -2],
      [3, -1],
      [2, 1],
      [0, 1],
      [0, 0],
    ],
  },
];

/** The monsters by number: the in-step firefly, then the ten kinds. */
export const BUG = { step: 0, kind: (k: number) => 1 + k } as const;

/** A kind's path as march corners: the first corner is where it stands, then each corner at 1 pixel a tick. */
export function marchOf(k: Kind): March[] {
  return [corner(0, 0, 1), ...k.path.map(([x, y]) => corner(x, y, 1))];
}

/** How far a kind's path reaches from where it starts, in blocks: [left, right, up, down]. */
export function reachOf(k: Kind): [number, number, number, number] {
  const xs = k.path.map(([x]) => x);
  const ys = k.path.map(([, y]) => y);
  return [Math.min(0, ...xs), Math.max(0, ...xs), Math.min(0, ...ys), Math.max(0, ...ys)];
}

/** What each does (.MON): a power above the hero's so a touch never pops one, can't be killed, passes through blocks (nothing is in its way). */
export function buildBugs(mb: Book): Monster[] {
  const set = newMonsterSet();
  const base = { power: 150, thru: 0, end: -2 };
  const one = (k: Kind) =>
    mon(
      blinkOf(k).map(([f, n]) => [mb.n(`bug.${f}`), n]),
      base,
      marchOf(k),
    );
  set[BUG.step] = one(STEP);
  KINDS.forEach((k, i) => (set[BUG.kind(i)] = one(k)));
  return set;
}
