// KIT DUCKS's one song, "Pan": eight bars of an easy, rolling tune in C major for the Sound
// Blaster (a lead that wanders, a walking bass and a plucked chord on the off-beat, each its own FM
// channel). It plays on the title, the menu, the levels and the endings. Note strings are the kit's
// (kit/tune.ts): a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'E5 q, G5 e, E5 e, C5 q, D5 q',
  'E5 q, D5 e, C5 e, G4 h',
  'A4 q, C5 e, E5 e, A5 q, G5 q',
  'F5 q, E5 e, D5 e, E5 h',
  'E5 q, G5 e, E5 e, C6 q, G5 q',
  'A5 q, G5 e, E5 e, D5 h',
  'F5 q, A5 e, F5 e, D5 q, B4 q',
  'C5 q, E5 q, C5 h',
);

/** One bar of each chord: its three notes for the off-beat chord, and its root and fifth for the bass. */
const CHORDS = {
  C: { arp: ['C4', 'E4', 'G4'], bass: ['C3', 'G3'] },
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
  F: { arp: ['A3', 'C4', 'F4'], bass: ['F2', 'C3'] },
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G2', 'D3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'C', 'Am', 'F', 'C', 'Am', 'F', 'G'];

// the bass walks on every beat; the chord answers on the off-beat (a rest, then the three notes)
const bass = join(...BARS.map((b) => [0, 1, 0, 1].map((i) => `${CHORDS[b].bass[i]} q`).join(', ')));
const chord = join(
  ...BARS.map(
    (b) =>
      `${CHORDS[b].arp.map((n) => `${n} e`).join(', ')}, ${CHORDS[b].arp[1]} e, ${CHORDS[b].arp[2]} e, ${CHORDS[b].arp[0]} e, ${CHORDS[b].arp[1]} e, ${CHORDS[b].arp[2]} e`,
  ),
);

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(104, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 95), v(2, INSTRUMENTS.pluck, chord, 55)]);
}
