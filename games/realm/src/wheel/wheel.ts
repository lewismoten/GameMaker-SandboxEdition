// The Royal Code Wheel: how its rings are laid out, and the three puzzles in the game it solves.
// The big disc has the letters A to Z round its rim and, inside, three rings of miners' marks;
// the small disc turns on top with a ring of runes against the letters and three windows, each
// onto a ring of marks of its own. Every carving begins with its key, set in brass: a letter
// and a rune. Turning the rune against the letter puts every other rune against the letter it
// stands for. The carvings and doors in the dungeons are built from these lists (art/runes.ts,
// levels/dungeons.ts), and printables.json's wheel and its "Tell me the answer"s must agree with
// them (web/src/manual/printables/codeWheelGames.test.ts).
import { RUNES, MARKS } from './glyphs';

export const OUTER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** The small disc's runes, clockwise from its pointer (an Old Procrastian never alphabetizes). */
export const INNER = [
  'Mull',
  'Snooze',
  'Snore',
  'Nap',
  'Drift',
  'Doze',
  'Putter',
  'Lag',
  'Rest',
  'Maybe',
  'Wait',
  'Shrug',
  'Sigh',
  'Later',
  'Loll',
  'Whenever',
  'Tarry',
  'Yawn',
  'Idle',
  'Soon',
  'Linger',
  'Mope',
  'Stall',
  'Someday',
  'Muse',
  'Pause',
].map((n) => `rune ${n}`);

/**
 * The marks printed on the big disc under the small one: three rings, outermost first, one mark
 * against each letter in each. Each window opens onto a ring of its own.
 */
export const HIDDEN: string[][] = [
  [
    'gem',
    'snail',
    'cart',
    'pick',
    'moon',
    'bell',
    'moon',
    'key',
    'snail',
    'pick',
    'bell',
    'key',
    'lamp',
    'snail',
    'lamp',
    'gear',
    'gem',
    'key',
    'gear',
    'cart',
    'bell',
    'moon',
    'pick',
    'gear',
    'lamp',
    'cart',
  ],
  [
    'gem',
    'pick',
    'key',
    'pick',
    'lamp',
    'gem',
    'snail',
    'cart',
    'bell',
    'gear',
    'lamp',
    'pick',
    'moon',
    'bell',
    'cart',
    'key',
    'snail',
    'gear',
    'gem',
    'lamp',
    'moon',
    'gear',
    'cart',
    'bell',
    'moon',
    'key',
  ],
  [
    'lamp',
    'snail',
    'gem',
    'bell',
    'cart',
    'bell',
    'snail',
    'pick',
    'snail',
    'gear',
    'lamp',
    'moon',
    'key',
    'pick',
    'gear',
    'bell',
    'moon',
    'key',
    'pick',
    'moon',
    'key',
    'cart',
    'gear',
    'gem',
    'lamp',
    'gem',
  ],
];

/** The small disc's windows: beside which of its runes each is cut, the ring it opens onto, and its number. */
export const WINDOWS = [
  { at: 4, ring: 0, label: '1' },
  { at: 13, ring: 1, label: '2' },
  { at: 22, ring: 2, label: '3' },
];

export const GLYPHS: Record<string, string[]> = { ...RUNES, ...MARKS };

/** A carving's key: turn this rune of the small disc against this letter of the big one. */
export interface Key {
  rune: string;
  letter: string;
}

/** How many places the small disc is turned (clockwise) when the key is set. */
export function turnOf(k: Key): number {
  const n = OUTER.length;
  return (((OUTER.indexOf(k.letter) - INNER.indexOf(k.rune)) % n) + n) % n;
}

/** Plain words in runes under a key (a space stays a space). */
export function carve(text: string, k: Key): (string | null)[] {
  const n = OUTER.length;
  const t = turnOf(k);
  return [...text].map((c) => (c === ' ' ? null : INNER[(((OUTER.indexOf(c) - t) % n) + n) % n]));
}

/** Runes read with the wheel set to a key. */
export function read(runes: (string | null)[], k: Key): string {
  const t = turnOf(k);
  return runes.map((r) => (r === null ? ' ' : OUTER[(INNER.indexOf(r) + t) % OUTER.length])).join('');
}

/** The marks in windows 1, 2 and 3 with the wheel set to a key. */
export function windowMarks(k: Key): string[] {
  const t = turnOf(k);
  return WINDOWS.map((w) => HIDDEN[w.ring][(w.at + t) % OUTER.length]);
}

/** A rune carving on a dungeon floor: its key and its lines of plain words. */
export interface Carving {
  key: Key;
  lines: string[];
}

/** The Snooze Barrows' way in, and the Hall of Sockets in Deadline Keep. */
export const CARVINGS = {
  barrows: { key: { rune: 'rune Yawn', letter: 'P' }, lines: ['FOGHORN', 'WEST'] },
  keep: { key: { rune: 'rune Snooze', letter: 'D' }, lines: ['SWING AS', 'HE COMES'] },
} satisfies Record<string, Carving>;

/**
 * The four doors across the Putoff Mines' timber stopes, west to east: the miners' brass plate
 * gives the key, the windows show the true door's marks, and the other three wear marks the
 * windows show at other settings.
 */
export const MINE_DOORS = (() => {
  const key: Key = { rune: 'rune Putter', letter: 'M' };
  const t = turnOf(key);
  const at = (d: number) => WINDOWS.map((w) => HIDDEN[w.ring][(w.at + t + d) % OUTER.length]);
  const open = 2;
  const doors = [at(7), at(18), windowMarks(key), at(11)];
  return { key, doors, open };
})();
