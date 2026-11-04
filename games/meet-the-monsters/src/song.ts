// MEET THE MONSTERS' one song, "Boing Boing, Hello": eight bars of a hopping tune in G major for
// the Sound Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays
// on the title, the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts):
// a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'G4 e, B4 e, D5 q, D5 e, E5 e, D5 q',
  'C5 e, E5 e, G5 q, G5 e, F5 e, E5 q',
  'D5 e, G5 e, B5 q, B5 e, A5 e, G5 q',
  'A4 e, C5 e, E5 q, A5 q, E5 q',
  'B4 e, D5 e, G5 q, G5 e, A5 e, G5 q',
  'E5 e, G5 e, C6 q, B5 e, A5 e, G5 q',
  'A5 e, G5 e, E5 q, C5 e, D5 e, E5 q',
  'G5 q, D5 q, G4 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G2', 'D3'] },
  C: { arp: ['C4', 'E4', 'G4'], bass: ['C3', 'G2'] },
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['G', 'C', 'G', 'Am', 'G', 'C', 'Am', 'G'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(126, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
