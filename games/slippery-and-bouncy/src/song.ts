// SLIPPERY AND BOUNCY's one song, "Mend and Go": eight bars of a warm, steady tune in F major for the
// Sound Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on the
// title, the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note,
// an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'F5 q, A5 q, C6 q, A5 e, F5 e',
  'G5 q, Bb5 q, D6 h',
  'A5 q, C6 q, F6 q, E6 e, C6 e',
  'D6 q, C6 q, A5 h',
  'Bb5 q, D6 q, F6 q, D6 e, Bb5 e',
  'A5 q, C6 q, E6 h',
  'D6 q, C6 q, Bb5 q, A5 e, G5 e',
  'F5 h, F5 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  F: { arp: ['F3', 'A3', 'C4'], bass: ['F2', 'C3'] },
  C: { arp: ['E3', 'G3', 'C4'], bass: ['C3', 'G2'] },
  Bb: { arp: ['Bb3', 'D4', 'F4'], bass: ['Bb2', 'F3'] },
  Dm: { arp: ['D3', 'F3', 'A3'], bass: ['D3', 'A2'] },
  Gm: { arp: ['G3', 'Bb3', 'D4'], bass: ['G2', 'D3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['F', 'C', 'F', 'Dm', 'Bb', 'C', 'Gm', 'F'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(120, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
