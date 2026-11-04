// SLIPPERY AND BOUNCY's one song, "Slide and Bounce": eight bars of a springy tune in C major for the
// Sound Blaster (a lead that hops, a bass and a plucked arpeggio, each its own FM channel). It plays on the
// title, the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note,
// an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'E5 e, G5 e, C6 q, G5 e, E5 e, G5 q',
  'D5 e, G5 e, B5 q, G5 e, D5 e, B5 q',
  'C5 e, E5 e, A5 q, E5 e, C5 e, A5 q',
  'A5 e, C6 e, F6 q, E6 e, C6 e, A5 q',
  'G5 e, C6 e, E6 q, C6 e, G5 e, E6 q',
  'G5 e, B5 e, D6 q, B5 e, G5 e, D6 q',
  'A5 q, C6 q, E6 q, D6 e, C6 e',
  'C6 h, C6 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  C: { arp: ['C3', 'E3', 'G3'], bass: ['C2', 'G2'] },
  G: { arp: ['B2', 'D3', 'G3'], bass: ['G2', 'D3'] },
  Am: { arp: ['A2', 'C3', 'E3'], bass: ['A2', 'E3'] },
  F: { arp: ['A2', 'C3', 'F3'], bass: ['F2', 'C3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(120, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
