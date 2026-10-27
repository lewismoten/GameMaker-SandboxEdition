// Stage 5-E, "The Ribbon Cable": out of the hard disk's plug and along its ribbon cable, corner
// to corner through the middle of the stage, to GLITCH. The track (cableTrack.ts) is one gray
// cable coiled corner to corner across a map that wraps on every side, with motherboard showing
// between the coils. Each lap ends at the kink, where the cable bends flat and carries on round
// the wrap as the next coil down, so riding along goes through every coil: the printed numbers
// count them down, 4, 3, 2, 1, to the plug at the far end. Two tape splices across the board
// let Right hop to the next coil a lap early; missing one only costs that lap.
//
// The cable is worn: splits where the colored wires inside show (one in each spits sparks) and
// nicks (some let Crosstalk crawl out).
import { Pixels } from '../../../kit/pixels';
import { buildPalette, type Pal } from '../art/pal';
import { CLEAR, blob } from '../art/draw';
import { boardParts, cableArt, cableBlocks, plugPic, type Mark } from '../blocks/cable';
import { mine, mite as miteMon, pics, stalker, swooper } from '../characters/enemies';
import { HURT } from '../characters/sharedMonsters';
import type { Bestiary } from '../characters/mons';
import { POWER } from '../ids';
import { cluster, keyOf, mite, slug, spike } from '../sprites/sprites';
import { CABLE_TRACK } from './cableTrack';
import { diagLeg } from './diagLeg';
import type { Leg } from './stage';

/** The tape splices: [lap, first column, columns], into the next coil down. */
const SPLICES: [number, number, number][] = [
  [1, 52, 14],
  [3, 26, 14],
];

/** A spark off a bare wire. */
export function zapPic(p: Pal, k: number): Pixels {
  const s = new Pixels(20, 20, CLEAR);
  blob(s, 10, 10, 3, 3, p.r('gold'), 2, 4);
  for (let i = 0; i < 6; i++) {
    const a = i + k * 0.5;
    for (let r = 4; r < 8; r++) s.set(10 + Math.cos(a) * r + (r & 1), 10 + Math.sin(a) * r, p.c(r < 6 ? 'gold' : 'steel', r < 6 ? 4 : 6));
  }
  return s;
}

/** The cable's virus. */
function virus(b: Bestiary, p: Pal): void {
  pics(b, 'packet', ...spike(keyOf(p, { main: 'gold', accent: 'glow' })));
  pics(b, 'noise', ...mite(keyOf(p, { main: 'virus', accent: 'slime' })));
  pics(b, 'slug', ...slug(keyOf(p, { main: 'red', accent: 'gold' })));
  pics(b, 'cluster', ...cluster(p, { main: 'virus', accent: 'red' }));
  b.mb.add('zap0', zapPic(p, 0), { chHitPt: HURT.hazard });
  b.mb.add('zap1', zapPic(p, 1), { chHitPt: HURT.hazard });
  // a Packet swoops to a spot just ahead on your line, then dives down the cable through it
  b.add('packet', {
    power: POWER.enemy,
    pics: [
      ['packet0', 4],
      ['packet1', 4],
    ],
    becomes: 'boom',
    score: 150,
    attack: {
      mode: 'player',
      legs: [
        [3, -3, 4],
        [-14, 14, 6],
      ],
    },
  });
  // Crosstalk waits by the cable's upper edge, then jumps across it, down and to the right
  swooper(b, 'noise', [[8, 8, 4]], { score: 120 });
  stalker(b, 'slug', { hp: 3, speed: 1, score: 250 });
  mine(b, 'cluster');
  // what the worn spots let out: sparks that jump up off a split, Crosstalk crawling out of a nick
  b.add('zap', {
    power: POWER.bullet,
    end: -1,
    path: [[-2, -2, 4]],
    pics: [
      ['zap0', 2],
      ['zap1', 2],
    ],
  });
  miteMon(b, 'crawl', [[-6, -6, 2]], { pic: 'noise', score: 60 });
}

/** The cable's map and blocks. */
export function cableLeg(): Leg {
  const pal = buildPalette('cable');
  return diagLeg<Mark>({
    file: 's5r',
    title: 'The Ribbon Cable',
    card: ['Ride the cable to its plug:', 'coils 4, 3, 2, 1. UP: faster.', 'RIGHT on the tape: hop to', 'the next coil. Mind sparks!'],
    seed: 501,
    pal,
    art: cableArt(pal),
    track: CABLE_TRACK,
    blocks: (bs) => cableBlocks(bs, pal),
    virus: (b) => virus(b, pal),
    // the plugs at the cable's two ends
    ends: { prefix: 'plug', start: (rows) => plugPic(pal, rows, 'R'), end: (rows) => plugPic(pal, rows, 'L') },
    // the board's parts (a trace runs with the cable)
    parts: boardParts(pal).map(([name, w, h, pic]) => [name, w, h, pic, name === 'trace']),
    partCount: 170,
    // a block of plain board: coil 0's slant has no cable
    plain: { x: 30, y: 80 },
    decorate: ({ mark }) => {
      // printed on the insulation: how many coils are left, and arrows along it
      for (let lap = 1; lap <= 4; lap++) {
        for (const x of [8, 44]) mark(lap, x, 13, `digit${5 - lap}`);
        for (const x of [20, 32, 56, 68]) mark(lap, x, 13, 'chevron');
        for (const x of lap === 4 ? [84] : [86, 94]) mark(lap, x, 13, 'chevron');
      }
      for (const x of [92, 96]) mark(0, x, 13, 'chevron');

      // splits in the insulation (the middle of each sparks) and nicks (some let Crosstalk out)
      const split = (lap: number, x0: number, n: number) => {
        for (let x = x0; x < x0 + n; x++) for (let o = 11; o <= 15; o++) mark(lap, x, o, x === x0 + (n >> 1) && o === 13 ? 'spark' : 'tear');
      };
      split(1, 24, 5);
      split(2, 16, 6);
      split(2, 64, 4);
      split(3, 48, 6);
      split(4, 24, 5);
      split(4, 58, 6);
      for (const [lap, x, o, kind] of [
        [1, 14, 17, 'nick'],
        [1, 46, 9, 'crawl'],
        [1, 70, 17, 'nick'],
        [2, 28, 9, 'nick'],
        [2, 40, 17, 'crawl'],
        [3, 12, 9, 'crawl'],
        [3, 64, 17, 'nick'],
        [4, 12, 17, 'nick'],
        [4, 40, 9, 'crawl'],
        [4, 70, 17, 'nick'],
      ] as [number, number, number, Mark][])
        mark(lap, x, o, kind);
    },
    shortcuts: SPLICES,
    shortcutMark: 'splice',
    // pickups (on the cable's middle line, which their pads are drawn on)
    pickups: [
      [0, 92, 'bit'],
      [0, 95, 'bit'],
      [1, 38, 'nova'],
      [1, 60, 'bit'],
      [1, 62, 'bit'],
      [2, 50, 'repair'],
      [2, 74, 'bit'],
      [3, 20, 'nova'],
      [3, 56, 'repair'],
      [4, 34, 'life'],
      [4, 66, 'bit'],
      [4, 68, 'bit'],
    ],
    pickupO: 13,
    // the virus
    foes: [
      // lap 1: coil 4 to go
      [1, 10, 10, 'packet'],
      [1, 16, 15, 'packet'],
      [1, 20, 9, 'noise'],
      [1, 44, 12, 'cluster'],
      [1, 48, 16, 'packet'],
      [1, 52, 8, 'noise'],
      [1, 58, 11, 'packet'],
      [1, 64, 9, 'noise'],
      [1, 66, 16, 'cluster'],
      [1, 72, 12, 'packet'],
      // lap 2
      [2, 10, 12, 'slug'],
      [2, 14, 9, 'noise'],
      [2, 22, 17, 'packet'],
      [2, 26, 10, 'packet'],
      [2, 32, 14, 'cluster'],
      [2, 36, 9, 'noise'],
      [2, 38, 17, 'cluster'],
      [2, 42, 11, 'packet'],
      [2, 66, 9, 'noise'],
      [2, 70, 16, 'packet'],
      [2, 74, 10, 'packet'],
      // lap 3
      [3, 10, 15, 'packet'],
      [3, 14, 10, 'packet'],
      [3, 22, 8, 'noise'],
      [3, 30, 16, 'cluster'],
      [3, 34, 11, 'cluster'],
      [3, 38, 14, 'slug'],
      [3, 44, 9, 'noise'],
      [3, 52, 16, 'packet'],
      [3, 58, 10, 'packet'],
      [3, 62, 8, 'noise'],
      // lap 4: the last coil
      [4, 10, 10, 'packet'],
      [4, 16, 16, 'packet'],
      [4, 20, 8, 'noise'],
      [4, 30, 12, 'cluster'],
      [4, 38, 16, 'packet'],
      [4, 44, 10, 'slug'],
      [4, 50, 8, 'noise'],
      [4, 54, 15, 'cluster'],
      [4, 62, 11, 'packet'],
      [4, 66, 16, 'packet'],
      [4, 72, 8, 'noise'],
    ],
    start: [0, 86, 13],
    cardView: { x: 76, dy: 2 },
  });
}
