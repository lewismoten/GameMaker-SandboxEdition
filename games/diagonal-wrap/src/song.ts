// DIAGONAL WRAP's one song, "Round and Round": eight bars of a tune in C major that ends where it began, for the
// Sound Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the
// title, the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note,
// an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'E5 q, G5 q, C6 q, G5 q',
  'G5 q, B5 q, D6 h',
  'F5 q, A5 q, D6 q, A5 q',
  'A5 q, C6 q, F5 h',
  'G5 q, B5 q, E6 q, B5 q',
  'B5 q, D6 q, G5 h',
  'A5 q, F5 q, D5 q, F5 q',
  'E5 q, G5 q, C5 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  C: { arp: ['C3', 'E3', 'G3'], bass: ['C2', 'G2'] },
  G: { arp: ['B2', 'D3', 'G3'], bass: ['G2', 'D3'] },
  Dm: { arp: ['D3', 'F3', 'A3'], bass: ['D2', 'A2'] },
  F: { arp: ['C3', 'F3', 'A3'], bass: ['F2', 'C3'] },
  Em: { arp: ['E3', 'G3', 'B3'], bass: ['E2', 'B2'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'G', 'Dm', 'F', 'Em', 'G', 'Dm', 'C'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(120, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
