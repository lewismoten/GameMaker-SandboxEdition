// CORNER VIEW's one song, "Round the Corner": eight bars of a steady, slightly sideways tune in A minor for the
// Sound Blaster (a lead, a bass and a plucked arpeggio, each its own FM channel). The lead goes up in steps and
// comes back down in steps, like walking up a stair. It plays on the title, the menu, the levels and the
// endings. Note strings are the kit's (kit/tune.ts): a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'A4 q, C5 q, E5 q, C5 q',
  'A4 q, D5 q, F5 q, D5 q',
  'B4 q, D5 q, G5 q, D5 q',
  'C5 q, E5 q, A5 h',
  'A5 q, G5 q, E5 q, C5 q',
  'F5 q, E5 q, D5 q, A4 q',
  'G4 q, B4 q, D5 q, B4 q',
  'A4 h, A4 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  Am: { arp: ['A2', 'C3', 'E3'], bass: ['A1', 'E2'] },
  Dm: { arp: ['D3', 'F3', 'A3'], bass: ['D2', 'A2'] },
  G: { arp: ['B2', 'D3', 'G3'], bass: ['G1', 'D2'] },
  C: { arp: ['C3', 'E3', 'G3'], bass: ['C2', 'G2'] },
  F: { arp: ['C3', 'F3', 'A3'], bass: ['F2', 'C3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['Am', 'Dm', 'G', 'C', 'Am', 'F', 'G', 'Am'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(100, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
