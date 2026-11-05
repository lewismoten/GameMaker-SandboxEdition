// MANY WEAPONS' one song, "Pouch Full": eight bars of a bouncy tune in G major for the Sound
// Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the title,
// the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note, an
// octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'G5 q, B5 e, D6 e, B5 q, G5 q',
  'A5 q, C6 e, E6 e, C6 q, A5 q',
  'B5 q, D6 e, G6 e, D6 q, B5 q',
  'A5 e, B5 e, C6 q, D6 h',
  'G5 q, B5 e, D6 e, G6 q, D6 q',
  'E6 q, C6 e, A5 e, C6 h',
  'B5 q, A5 e, G5 e, F#5 q, A5 q',
  'G5 q, D5 q, G5 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G2', 'D3'] },
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
  C: { arp: ['G3', 'C4', 'E4'], bass: ['C3', 'G3'] },
  D: { arp: ['A3', 'D4', 'F#4'], bass: ['D3', 'A2'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['G', 'Am', 'G', 'D', 'G', 'Am', 'D', 'G'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(132, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
