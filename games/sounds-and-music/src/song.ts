// SOUNDS AND MUSIC's two songs, both original and both written as note strings (kit/tune.ts):
//   meadow  "Meadow Walk": eight bars in G major at a steady walk (a lead, a bass and a plucked
//           arpeggio, each its own FM channel). It plays on the title, the menu, level 1 and the endings.
//   waltz   "Lantern Waltz": eight bars of three beats in A minor (a bell, a bass on the first beat
//           and plucks on the other two). It plays only in level 2. Level 3 names no song at all.
// A note, an octave and a length (w h q e), as in "E5 q"; "r q" is a rest.
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MEADOW_MELODY = join(
  'G4 q, B4 q, D5 q, B4 q',
  'C5 q, E5 q, D5 h',
  'B4 q, D5 q, G5 q, D5 q',
  'E5 q, C5 q, D5 h',
  'G5 e, F#5 e, E5 e, D5 e, B4 q, D5 q',
  'C5 q, E5 q, A4 h',
  'B4 q, D5 q, E5 q, F#5 q',
  'G5 w',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  G: { arp: ['G3', 'B3', 'D4'], bass: ['G2', 'D3'] },
  C: { arp: ['G3', 'C4', 'E4'], bass: ['C3', 'G3'] },
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
  D: { arp: ['A3', 'D4', 'F#4'], bass: ['D3', 'A3'] },
} as const;
const MEADOW_BARS: (keyof typeof CHORDS)[] = ['G', 'C', 'G', 'C', 'G', 'Am', 'D', 'G'];

const arp = join(...MEADOW_BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...MEADOW_BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** "Meadow Walk" as a .CMF file. */
export function meadow(): Uint8Array {
  return tune(116, [v(0, INSTRUMENTS.lead, MEADOW_MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}

const WALTZ_MELODY = join(
  'A4 q, C5 q, E5 q',
  'D5 h, C5 q',
  'B4 q, G#4 q, B4 q',
  'A4 h, r q',
  'E5 q, F5 q, E5 q',
  'D5 q, C5 q, B4 q',
  'A4 q, G#4 q, B4 q',
  'A4 h, r q',
);
/** The waltz's bars: a root for the bass, and the two plucks for beats 2 and 3. */
const WALTZ = [
  ['A2', 'C4', 'E4'],
  ['D3', 'D4', 'F4'],
  ['E3', 'G#3', 'B3'],
  ['A2', 'C4', 'E4'],
  ['D3', 'D4', 'F4'],
  ['G2', 'B3', 'D4'],
  ['E3', 'G#3', 'B3'],
  ['A2', 'C4', 'E4'],
] as const;
const waltzBass = join(...WALTZ.map(([root]) => `${root} q, r q, r q`));
const waltzPluck = join(...WALTZ.map(([, a, b]) => `r q, ${a} q, ${b} q`));

/** "Lantern Waltz" as a .CMF file. */
export function waltz(): Uint8Array {
  return tune(100, [v(0, INSTRUMENTS.bell, WALTZ_MELODY, 100), v(1, INSTRUMENTS.bass, waltzBass, 90), v(2, INSTRUMENTS.pluck, waltzPluck, 65)]);
}
