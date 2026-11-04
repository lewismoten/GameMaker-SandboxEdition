// THROW IT's one song, "Toss and Catch": eight bars of a bouncy tune in D major for the Sound
// Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the title,
// the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note, an
// octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'D5 e, F#5 e, A5 q, A5 e, F#5 e, D5 q',
  'B4 e, D5 e, G5 q, G5 e, B5 e, A5 q',
  'F#5 e, A5 e, D6 q, A5 e, F#5 e, A5 q',
  'E5 e, A5 e, C#6 q, B5 e, A5 e, E5 q',
  'F#5 e, B5 e, D6 q, D6 e, C#6 e, B5 q',
  'B5 e, A5 e, G5 q, B5 e, D6 e, B5 q',
  'C#6 e, B5 e, A5 q, E5 e, G5 e, A5 q',
  'D5 e, F#5 e, A5 q, D6 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  D: { arp: ['A3', 'D4', 'F#4'], bass: ['D3', 'A2'] },
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G2', 'D3'] },
  A: { arp: ['A3', 'C#4', 'E4'], bass: ['A2', 'E3'] },
  Bm: { arp: ['B3', 'D4', 'F#4'], bass: ['B2', 'F#3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['D', 'G', 'D', 'A', 'Bm', 'G', 'A', 'D'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(132, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
