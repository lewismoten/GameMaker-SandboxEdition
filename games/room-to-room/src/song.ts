// ROOM TO ROOM's one song, "Next Door": eight bars of a bouncy, open tune in C major for the
// Sound Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the
// title, the menu, the rooms and the endings. Note strings are the kit's (kit/tune.ts): a note,
// an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'E5 q, G5 e, E5 e, C5 q, D5 q',
  'E5 e, F5 e, G5 q, A5 h',
  'G5 q, E5 e, G5 e, C6 q, B5 q',
  'A5 q, G5 q, E5 h',
  'F5 q, A5 e, F5 e, D5 q, E5 q',
  'F5 e, G5 e, A5 q, B5 h',
  'C6 q, B5 e, A5 e, G5 q, E5 q',
  'D5 q, E5 q, C5 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  C: { arp: ['C4', 'E4', 'G4'], bass: ['C3', 'G3'] },
  F: { arp: ['C4', 'F4', 'A4'], bass: ['F3', 'C3'] },
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G3', 'D3'] },
  Am: { arp: ['C4', 'E4', 'A4'], bass: ['A2', 'E3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'C', 'C', 'Am', 'F', 'G', 'C', 'G'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(120, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
