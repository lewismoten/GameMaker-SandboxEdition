// AROUND THE ROOM's one song, "Waltz Around": eight bars of a turning tune in three beats to the bar, in C
// for the Sound Blaster (a lead, a bass that steps oom-pah-pah and a plucked chord, each its own FM channel). It
// plays on the title, the menu, the levels and the endings.
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'C5 q, E5 q, G5 q',
  'A5 h, G5 q',
  'F5 q, A5 q, C6 q',
  'G5 h, E5 q',
  'D5 q, F5 q, A5 q',
  'G5 q, E5 q, C5 q',
  'D5 q, E5 q, F5 q',
  'C5 h.',
  'C5 q, E5 q, G5 q',
  'A5 h, G5 q',
  'F5 q, A5 q, C6 q',
  'E6 h, C6 q',
  'D6 q, B5 q, G5 q',
  'C6 q, A5 q, F5 q',
  'G5 q, D5 q, B4 q',
  'C5 h.',
);

/** One bar's chord: its root for the bass, and its two upper notes for the pluck. */
const CHORDS = {
  C: { root: 'C3', up: ['E4', 'G4'] },
  F: { root: 'F2', up: ['A3', 'C4'] },
  G: { root: 'G2', up: ['B3', 'D4'] },
  D: { root: 'D3', up: ['F4', 'A4'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'F', 'F', 'C', 'D', 'C', 'G', 'C', 'C', 'F', 'F', 'C', 'G', 'F', 'G', 'C'];

const bass = join(...BARS.map((b) => `${CHORDS[b].root} q, ${CHORDS[b].root} q, ${CHORDS[b].root} q`));
const chord = join(...BARS.map((b) => `${CHORDS[b].up[0]} q, ${CHORDS[b].up[1]} q, ${CHORDS[b].up[0]} q`));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(132, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 95), v(2, INSTRUMENTS.pluck, chord, 50)]);
}
