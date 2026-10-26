// Stage 2-A, "The Ring Buffer": Memory Lane's diagonal leg, on the track builder (diagLeg.ts).
// Four rows of memory run corner to corner from TAIL to HEAD; each lap ends where the row bends
// flat at the kink and wraps round onto the next row, and the rows count down, 3, 2, 1. Parity
// Bats dive down the row, Watchers cross it, a Leak Slug or two hunt you, stuck bits spark and
// leaks let mites out. One pointer jumps a row a lap early.
import { bat, cluster, eye, keyOf, mite, slug } from '../sprites/sprites';
import { buildPalette, type Pal } from '../art/pal';
import { pointer, ringArt, ringBlocks, ringParts, type RingMark } from '../blocks/ring';
import { mine, pics, stalker } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import { DiagTrack } from './diagTrack';
import { diagFoes, diagLeg } from './diagLeg';
import type { Leg } from './stage';

const TRACK = new DiagTrack({ pitch: 25, lanes: 4, board: 9, kink: 75, first: 0, last: 3, startCols: [76, 77, 78], endCols: [85, 86, 87] });

/** The pointer: [lap, first column, columns], onto the next row down. */
const SHORTCUTS: [number, number, number][] = [[2, 30, 14]];

function virus(b: Bestiary, p: Pal): void {
  pics(b, 'bat', ...bat(keyOf(p, { main: 'virus', accent: 'slime' })));
  pics(b, 'eye', ...eye(keyOf(p, { main: 'virus', accent: 'red' })));
  pics(b, 'mite', ...mite(keyOf(p, { main: 'gold', accent: 'red' })));
  pics(b, 'slug', ...slug(keyOf(p, { main: 'slime', accent: 'pink' })));
  pics(b, 'cluster', ...cluster(p, { main: 'slime', accent: 'gold' }));
  // Parity Bats dive down the row, Watchers cross it
  diagFoes(b, p, { diver: 'bat', swooper: 'eye', mite: 'mite', score: 120, speed: 4 });
  stalker(b, 'slug', { hp: 3, speed: 1, score: 300 });
  mine(b, 'cluster');
}

export function ringLeg(): Leg {
  const pal = buildPalette('ram');
  const k = TRACK;
  // the middle line of a row, where the pickups and the marks go
  const mid = 17;
  return diagLeg<RingMark>({
    file: 's2r',
    title: 'The Ring Buffer',
    card: ['A ring buffer wraps: ride', 'rows 3, 2, 1 from TAIL to', 'HEAD. The cyan pointer', 'jumps a row: hold RIGHT.'],
    seed: 241,
    pal,
    art: ringArt(pal, k),
    track: k,
    blocks: (bs) => ringBlocks(bs, pal, k),
    virus: (b) => virus(b, pal),
    ends: { prefix: 'ptr', start: (rows) => pointer(pal, rows, 'TAIL'), end: (rows) => pointer(pal, rows, 'HEAD') },
    parts: ringParts(pal),
    partCount: 120,
    // plain board: row 0's slant is bare
    plain: { x: 30, y: 85 },
    decorate: ({ mark }) => {
      for (let lap = 1; lap <= 3; lap++) {
        for (const x of [8, 44]) mark(lap, x, mid, `digit${4 - lap}`);
        for (const x of [20, 32, 56, 68]) mark(lap, x, mid, 'arrow');
        for (const x of lap === 3 ? [80] : [84, 94]) mark(lap, x, mid, 'arrow');
      }
      for (const x of [92, 96]) mark(0, x, mid, 'arrow');
      for (const [lap, x0, n] of SHORTCUTS) for (let x = x0; x < x0 + n; x++) for (let o = -1; o < k.board + 2; o++) mark(lap + 1, x, o, 'link');
      for (const [lap, x, o, m] of [
        [1, 24, mid, 'stuck'],
        [1, 58, mid + 3, 'leak'],
        [2, 16, mid - 3, 'leak'],
        [2, 52, mid + 2, 'stuck'],
        [2, 66, mid - 2, 'stuck'],
        [3, 22, mid + 3, 'leak'],
        [3, 48, mid, 'stuck'],
        [3, 64, mid - 3, 'leak'],
      ] as [number, number, number, RingMark][])
        mark(lap, x, o, m);
    },
    shortcuts: SHORTCUTS,
    pickups: [
      [0, 92, 'bit'],
      [0, 95, 'bit'],
      [1, 36, 'nova'],
      [1, 66, 'bit'],
      [1, 68, 'bit'],
      [2, 26, 'repair'],
      [2, 72, 'bit'],
      [3, 30, 'nova'],
      [3, 56, 'repair'],
      [3, 70, 'bit'],
    ],
    pickupO: mid,
    foes: [
      [1, 12, 14, 'bat'],
      [1, 18, 12, 'eye'],
      [1, 30, 19, 'bat'],
      [1, 42, 16, 'cluster'],
      [1, 50, 12, 'eye'],
      [1, 54, 20, 'bat'],
      [1, 64, 13, 'bat'],
      [1, 72, 12, 'eye'],
      [2, 10, 18, 'bat'],
      [2, 20, 12, 'eye'],
      [2, 26, 20, 'cluster'],
      [2, 40, 15, 'slug'],
      [2, 46, 12, 'eye'],
      [2, 58, 19, 'bat'],
      [2, 62, 14, 'bat'],
      [2, 72, 12, 'eye'],
      [3, 10, 13, 'eye'],
      [3, 16, 19, 'bat'],
      [3, 26, 15, 'cluster'],
      [3, 34, 12, 'eye'],
      [3, 40, 18, 'bat'],
      [3, 52, 14, 'slug'],
      [3, 60, 12, 'eye'],
      [3, 68, 19, 'bat'],
      [3, 72, 15, 'bat'],
    ],
    start: [0, 86, mid],
    cardView: { x: 68, dy: 3 },
  });
}
