// FLICKER AND FLOW's one song, written for this game: a short, warm tune in A minor for the Sound Blaster (a lead, a
// bass and a plucked arpeggio, each its own FM channel), eight bars that repeat. The lead's rhythm is uneven on
// purpose, like the flames. It plays on the title, the menu, the levels and the endings. Note strings are the kit's
// (kit/tune.ts): a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'A4 q, C5 e, B4 e, A4 q, E4 q',
  'F4 q, A4 e, G4 e, F4 h',
  'E4 q, G4 e, A4 e, C5 q, B4 q',
  'A4 h, E4 h',
  'A4 q, C5 e, E5 e, D5 q, C5 q',
  'D5 q, F5 e, E5 e, D5 h',
  'C5 q, B4 e, A4 e, G4 q, E4 q',
  'A4 w',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
  F: { arp: ['A3', 'C4', 'F4'], bass: ['F2', 'C3'] },
  C: { arp: ['G3', 'C4', 'E4'], bass: ['C3', 'G3'] },
  Dm: { arp: ['A3', 'D4', 'F4'], bass: ['D3', 'A3'] },
  E: { arp: ['G#3', 'B3', 'E4'], bass: ['E3', 'B3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['Am', 'F', 'C', 'E', 'Am', 'Dm', 'C', 'Am'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(104, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
