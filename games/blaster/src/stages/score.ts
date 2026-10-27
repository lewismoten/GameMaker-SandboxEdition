// Stage 3-A, "The Score": the sound card's diagonal leg, on the track builder (diagLeg.ts).
// Five staves of the FM chip's song run corner to corner from a treble clef to the final
// double bar; each lap ends where the staff bends flat at the kink and wraps round onto the
// next staff, and the measure numbers count them down, 4, 3, 2, 1. Wasps dive down the staff,
// Note-heads hop across it, records sit on the lines like mines, sharps spark and rests let
// mites out. One tie carries you to the next staff a lap early.
import { cluster, disc, keyOf, mite, note, wasp } from '../sprites/sprites';
import { buildPalette, type Pal } from '../art/pal';
import { scoreArt, scoreBlocks, scoreEnd, scoreParts, scoreRamps, type ScoreMark } from '../blocks/score';
import { mine, pics } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import { DiagTrack } from './diagTrack';
import { diagFoes, diagLeg } from './diagLeg';
import type { Leg } from './stage';

const TRACK = new DiagTrack({ pitch: 20, lanes: 5, board: 6, kink: 80, first: 0, last: 4, startCols: [81, 82, 83], endCols: [88, 89, 90] });

/** The tie: [lap, first column, columns], onto the next staff down. */
const SHORTCUTS: [number, number, number][] = [[2, 44, 14]];

function virus(b: Bestiary, p: Pal): void {
  pics(b, 'wasp', ...wasp(keyOf(p, { main: 'gold', accent: 'cyan' })));
  const [n0, n1] = note(keyOf(p, { main: 'virus', accent: 'slime' }));
  pics(b, 'note', n0, n1);
  pics(b, 'mite', ...mite(keyOf(p, { main: 'cyan', accent: 'pink' })));
  pics(b, 'disc', ...disc(p, { main: 'gray', accent: 'cyan' }));
  pics(b, 'cluster', ...cluster(p, { main: 'pink', accent: 'gold' }));
  // Wasps dive down the staff, Note-heads hop across it
  diagFoes(b, p, { diver: 'wasp', swooper: 'note', mite: 'mite', score: 150, speed: 4 });
  mine(b, 'disc', { hp: 3, score: 120 });
  mine(b, 'cluster', { hp: 2 });
}

export function scoreLeg(): Leg {
  const pal = buildPalette('sound');
  scoreRamps(pal);
  const k = TRACK;
  // the middle line of a staff (its third line), where the pickups and the marks go
  const mid = 13;
  return diagLeg<ScoreMark>({
    file: 's3r',
    title: 'The Score',
    card: ['The FM chip plays from a', 'score: ride the staves, 4,', '3, 2, 1, to the last bar.', 'A tie hops one: hold RIGHT.'],
    seed: 341,
    pal,
    art: scoreArt(pal, k),
    track: k,
    blocks: (bs) => scoreBlocks(bs, pal, k),
    virus: (b) => virus(b, pal),
    ends: { prefix: 'end', start: (rows) => scoreEnd(pal, rows, 'clef'), end: (rows) => scoreEnd(pal, rows, 'fine') },
    parts: scoreParts(pal),
    partCount: 150,
    // plain board: staff 0's slant is bare
    plain: { x: 30, y: 80 },
    decorate: ({ mark }) => {
      for (let lap = 1; lap <= 4; lap++) {
        for (const x of [8, 44]) mark(lap, x, mid, `digit${5 - lap}`);
        for (const x of [20, 32, 56, 68]) mark(lap, x, mid, 'arrow');
        for (const x of lap === 4 ? [84] : [86, 94]) mark(lap, x, mid, 'arrow');
      }
      for (const x of [92, 96]) mark(0, x, mid, 'arrow');
      for (const [lap, x, o, m] of [
        [1, 24, mid, 'sharp'],
        [1, 60, mid + 3, 'rest'],
        [2, 16, mid - 3, 'rest'],
        [2, 62, mid, 'sharp'],
        [3, 22, mid + 3, 'sharp'],
        [3, 50, mid - 3, 'rest'],
        [4, 26, mid, 'sharp'],
        [4, 58, mid + 3, 'rest'],
      ] as [number, number, number, ScoreMark][])
        mark(lap, x, o, m);
    },
    shortcuts: SHORTCUTS,
    shortcutMark: 'tie',
    pickups: [
      [0, 92, 'bit'],
      [0, 95, 'bit'],
      [1, 38, 'nova'],
      [1, 66, 'bit'],
      [2, 30, 'repair'],
      [2, 74, 'bit'],
      [3, 36, 'nova'],
      [3, 64, 'repair'],
      [4, 36, 'life'],
      [4, 68, 'bit'],
    ],
    pickupO: mid,
    foes: [
      [1, 10, 10, 'wasp'],
      [1, 16, 8, 'note'],
      [1, 30, 16, 'disc'],
      [1, 46, 9, 'note'],
      [1, 52, 15, 'wasp'],
      [1, 64, 8, 'note'],
      [1, 72, 12, 'wasp'],
      [2, 10, 15, 'wasp'],
      [2, 22, 8, 'note'],
      [2, 34, 12, 'cluster'],
      [2, 40, 9, 'note'],
      [2, 54, 16, 'wasp'],
      [2, 66, 8, 'note'],
      [2, 72, 14, 'wasp'],
      [3, 10, 8, 'note'],
      [3, 16, 15, 'wasp'],
      [3, 28, 11, 'disc'],
      [3, 40, 8, 'note'],
      [3, 44, 16, 'wasp'],
      [3, 56, 9, 'note'],
      [3, 70, 14, 'wasp'],
      [4, 10, 12, 'wasp'],
      [4, 18, 8, 'note'],
      [4, 32, 16, 'cluster'],
      [4, 42, 9, 'note'],
      [4, 50, 14, 'wasp'],
      [4, 62, 8, 'note'],
      [4, 72, 16, 'wasp'],
    ],
    start: [0, 86, mid],
    cardView: { x: 74, dy: 3 },
  });
}
