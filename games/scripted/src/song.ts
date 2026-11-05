// THE SHOW's one song, "Curtain Call": eight bars of a bouncing little tune in C major for the Sound
// Blaster (a plucked lead, a bass and a soft arpeggio, each its own FM channel). It plays on the title,
// the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note, an
// octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'C5 e, E5 e, G5 q, E5 e, C5 e, D5 q',
  'D5 e, F5 e, A5 q, F5 e, D5 e, E5 q',
  'E5 e, G5 e, C6 q, G5 e, E5 e, F5 q',
  'D5 e, E5 e, D5 q, G4 h',
  'C5 e, E5 e, G5 q, E5 e, C5 e, D5 q',
  'F5 e, A5 e, C6 q, A5 e, F5 e, G5 q',
  'E5 e, D5 e, C5 q, B4 e, D5 e, G4 q',
  'C5 e, E5 e, G5 q, C5 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  C: { arp: ['G3', 'C4', 'E4'], bass: ['C3', 'G2'] },
  Dm: { arp: ['A3', 'D4', 'F4'], bass: ['D3', 'A2'] },
  F: { arp: ['A3', 'C4', 'F4'], bass: ['F3', 'C3'] },
  G: { arp: ['G3', 'B3', 'D4'], bass: ['G2', 'D3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'Dm', 'C', 'G', 'C', 'F', 'C', 'C'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(104, [v(0, INSTRUMENTS.pluck, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.lead, arp, 40)]);
}
