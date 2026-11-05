// ROLL THE DICE's one song, "Tick Tock": eight bars of a ticking tune in G major for the Sound
// Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the title,
// the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note, an
// octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'G5 e, G5 e, D5 q, G5 e, G5 e, D6 q',
  'B5 e, B5 e, G5 q, B5 e, B5 e, D6 q',
  'C6 e, C6 e, A5 q, C6 e, C6 e, E6 q',
  'D6 e, B5 e, G5 q, D6 h',
  'E6 e, E6 e, C6 q, E6 e, E6 e, G6 q',
  'D6 e, D6 e, B5 q, D6 e, D6 e, B5 q',
  'A5 e, D6 e, F#5 q, A5 e, D6 e, A5 q',
  'G5 e, B5 e, D6 q, G6 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  G: { arp: ['G3', 'B3', 'D4'], bass: ['G2', 'D3'] },
  Em: { arp: ['E3', 'G3', 'B3'], bass: ['E2', 'B2'] },
  C: { arp: ['E3', 'G3', 'C4'], bass: ['C3', 'G2'] },
  D: { arp: ['F#3', 'A3', 'D4'], bass: ['D3', 'A2'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['G', 'Em', 'C', 'G', 'C', 'G', 'D', 'G'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(144, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
