// PARALLAX's one song, "Sliding By": eight bars of an easy, rolling tune in G major for the Sound
// Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the title,
// the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note, an
// octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'B4 q, D5 q, G5 q, D5 q',
  'C5 q, E5 q, G5 h',
  'B4 q, D5 q, G5 q, B5 q',
  'A5 h, D5 h',
  'C5 q, E5 q, A5 q, E5 q',
  'D5 q, F5 q, A5 h',
  'B4 q, D5 q, E5 q, G5 q',
  'G5 w',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  G: { arp: ['G3', 'B3', 'D4'], bass: ['G2', 'D3'] },
  C: { arp: ['G3', 'C4', 'E4'], bass: ['C3', 'G2'] },
  D: { arp: ['A3', 'D4', 'F4'], bass: ['D3', 'A2'] },
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['G', 'C', 'G', 'D', 'Am', 'D', 'C', 'G'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(100, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
