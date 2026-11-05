// DAY AND NIGHT's one song, "Lamp Lighter": eight bars of a slow, gentle tune in C major for the Sound
// Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the title,
// the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note, an
// octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'E5 q, G5 q, E5 q, C5 q',
  'D5 q, G5 q, D5 q, B4 q',
  'E5 q, G5 q, C6 q, G5 q',
  'A5 h, F5 h',
  'F5 q, A5 q, F5 q, C5 q',
  'E5 q, G5 q, E5 q, C5 q',
  'D5 q, G5 q, B5 q, G5 q',
  'C6 w',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  C: { arp: ['C3', 'E3', 'G3'], bass: ['C2', 'G2'] },
  G: { arp: ['G2', 'B2', 'D3'], bass: ['G2', 'D3'] },
  F: { arp: ['F2', 'A2', 'C3'], bass: ['F2', 'C3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'G', 'C', 'F', 'F', 'C', 'G', 'C'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(100, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
