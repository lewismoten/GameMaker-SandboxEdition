// FIREWORKS' one song, written for the game: sixteen bars in C major for the Sound Blaster, a tune that climbs like a
// rocket and comes down in little steps (a lead, a bass and a plucked arpeggio, each its own FM channel). It plays on
// the title, the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note, an octave and a
// length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'C5 q, E5 q, G5 h',
  'A5 q, G5 q, E5 h',
  'F5 q, A5 q, C6 q, A5 q',
  'G5 w',
  'E5 q, G5 q, C6 h',
  'B5 q, A5 q, G5 h',
  'F5 q, D5 q, E5 q, F5 q',
  'E5 h, C5 h',
  'G5 q, G5 e, A5 e, G5 q, E5 q',
  'F5 q, F5 e, G5 e, F5 q, D5 q',
  'E5 q, G5 q, C6 q, E6 q',
  'D6 w',
  'C6 q, B5 q, A5 q, G5 q',
  'F5 q, A5 q, D6 h',
  'C6 q, G5 q, E5 q, D5 q',
  'C5 w',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  C: { arp: ['C4', 'E4', 'G4'], bass: ['C3', 'G3'] },
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
  F: { arp: ['A3', 'C4', 'F4'], bass: ['F3', 'C3'] },
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G3', 'D3'] },
  Dm: { arp: ['A3', 'D4', 'F4'], bass: ['D3', 'A2'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'Am', 'F', 'G', 'C', 'G', 'Dm', 'C', 'C', 'Dm', 'C', 'G', 'Am', 'F', 'G', 'C'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(120, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
