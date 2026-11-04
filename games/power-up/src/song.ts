// POWER UP's one song, "Tiptoe": eight bars of a careful, light tune in A minor for the
// Sound Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the
// title, the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note,
// an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'A4 e, C5 e, E5 q, D5 e, C5 e, B4 q',
  'C5 e, E5 e, A5 q, G5 h',
  'F5 q, E5 e, D5 e, C5 q, D5 q',
  'E5 q, C5 q, A4 h',
  'A4 e, C5 e, E5 q, D5 e, C5 e, B4 q',
  'G4 e, B4 e, D5 q, E5 h',
  'F5 e, E5 e, D5 e, C5 e, B4 q, G4 q',
  'A4 q, E4 q, A4 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
  F: { arp: ['A3', 'C4', 'F4'], bass: ['F2', 'C3'] },
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G2', 'D3'] },
  E: { arp: ['B3', 'D4', 'E4'], bass: ['E2', 'B2'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['Am', 'Am', 'F', 'Am', 'Am', 'G', 'F', 'E'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(110, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
