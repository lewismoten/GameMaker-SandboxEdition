// The clocked blocks added when four short levels were deepened (props.ts calls this after its own groups):
//   ripple    rUpA rUpB rHalf rUnder rRise: one stepping stone on a quick clock, in five phases. Placed in the order
//             RIPPLE_ORDER along a stream, the stones come up one after another like a wave (STEPPING STONES)
//   turning   the ridge's wind that changes: for each of WIND_RINGS a gust that blows right, goes calm, blows left, goes
//             calm again (`w<k>_<phase>`), and a flag with two lamps beside it that shows the same phases (`v<k>_<phase>`)
//   clues     what the mountain left in THE EMPTY SPOT: five small things to take (rug, chip, fluff, drift, arrow)
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { LEDGE, PULL, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { CLUES, clue } from './art/clues';
import { vane } from './art/vane';
import { gust, stone } from './art/weather';
import type { Timed } from './props';

/**
 * Ticks the ripple stones stay up (A then B: a window of 100), half, under and rising again (one loop is their sum, 160).
 * Started in the five states of RIPPLE_ORDER, their windows open at 0, 10, 50, 60 and 110 of the loop and each lasts 100.
 */
export const RIPPLE = { upA: 50, upB: 50, half: 10, under: 40, rise: 10 } as const;
/** The five starting states in the order that makes a wave: each stone comes up a little after the one before it. */
export const RIPPLE_ORDER = ['rUpA', 'rRise', 'rUnder', 'rHalf', 'rUpB'] as const;

/** A wind ring: its phases in turn, as [which way (1 right, -1 left, 0 calm), ticks]. */
export interface WindRing {
  phases: readonly (readonly [number, number])[];
}
export const WIND_RINGS: readonly WindRing[] = [
  {
    phases: [
      [0, 60],
      [1, 80],
      [0, 50],
      [-1, 80],
    ],
  },
  {
    phases: [
      [1, 90],
      [0, 45],
      [-1, 60],
      [0, 35],
    ],
  },
];

/** The gust block shown during phase `p` of ring `k` (a moving phase has two pictures, `a` then `b`). */
export const gustName = (k: number, p: number, half?: 'a' | 'b'): string => `w${k}_${p}${half ?? ''}`;
/** The flag block shown during phase `p` of ring `k`. */
export const vaneName = (k: number, p: number, half?: 'a' | 'b'): string => `v${k}_${p}${half ?? ''}`;
/** Each clue's block name. */
export const clueName = (i: number): string => `clue_${CLUES[i]}`;
/** The sky that stands where clue `i` will show when the last stars come out. */
export const hidName = (i: number): string => `hid_${CLUES[i]}`;

export function deeperProps(book: Book, pal: Pal, groups: readonly string[], points: { clue: number }, counter: number, late: number): Timed[] {
  const has = (g: string) => groups.includes(g);
  const timed: Timed[] = [];
  const loop = (names: string[], ticks: number[]) => names.forEach((n, i) => timed.push({ name: n, next: names[(i + 1) % names.length], ticks: ticks[i] }));
  const air = { grav: PULL.down };
  if (has('ripple')) {
    const up: Pixels = stone(pal, 'up');
    book.add('rUpA', up, { solid: LEDGE, grav: PULL.down });
    book.add('rUpB', up, { solid: LEDGE, grav: PULL.down });
    book.add('rHalf', stone(pal, 'half'), air);
    book.add('rUnder', stone(pal, 'under'), air);
    book.add('rRise', stone(pal, 'half'), air);
    loop(['rUpA', 'rUpB', 'rHalf', 'rUnder', 'rRise'], [RIPPLE.upA, RIPPLE.upB, RIPPLE.half, RIPPLE.under, RIPPLE.rise]);
  }
  if (has('turning')) {
    const sky = book.pics.get('sky') as Pixels;
    WIND_RINGS.forEach((ring, k) => {
      const names: string[] = [];
      const ticks: number[] = [];
      const flags: string[] = [];
      const flagTicks: number[] = [];
      ring.phases.forEach(([dir, len], p) => {
        if (dir === 0) {
          book.add(gustName(k, p), sky, air);
          names.push(gustName(k, p));
          ticks.push(len);
          // a calm shows its last stretch with one lamp: the wind is about to change
          const half = Math.floor(len / 2);
          book.add(vaneName(k, p, 'a'), vane(pal, 'still', 2), air);
          book.add(vaneName(k, p, 'b'), vane(pal, 'still', 1), air);
          flags.push(vaneName(k, p, 'a'), vaneName(k, p, 'b'));
          flagTicks.push(half, len - half);
        } else {
          for (const [h, f] of [
            ['a', 0],
            ['b', 1],
          ] as const) {
            book.add(gustName(k, p, h), gust(pal, dir > 0 ? 1 : -1, f), { grav: dir > 0 ? PULL.right : PULL.left });
            names.push(gustName(k, p, h));
            ticks.push(len / 2);
          }
          book.add(vaneName(k, p), vane(pal, dir > 0 ? 'right' : 'left', 2), air);
          flags.push(vaneName(k, p));
          flagTicks.push(len);
        }
      });
      loop(names, ticks);
      loop(flags, flagTicks);
    });
  }
  if (has('clues')) {
    const sky = book.pics.get('sky') as Pixels;
    CLUES.forEach((c, i) => {
      book.add(clueName(i), clue(pal, c), { ...air, score: points.clue, effect: counter, eamt: 1, touch: 'sky' });
      book.add(hidName(i), sky, air);
      timed.push({ name: hidName(i), next: clueName(i), ticks: late });
    });
  }
  return timed;
}
