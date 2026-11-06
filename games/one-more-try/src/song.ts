// TRY AGAIN's one song, "Once More": eight bars of a hopeful, bouncy tune in C major for the
// Sound Blaster (a lead, a bass that knocks on the beat and a plucked off-beat chord, each its
// own FM channel). It plays on the title, the menu, the levels and the endings. Note strings are
// the kit's (kit/tune.ts): a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'C5 e, E5 e, G5 q, E5 e, C5 e, G4 q',
  'F4 e, A4 e, C5 q, A4 e, F4 e, C5 q',
  'G4 e, B4 e, D5 q, G5 e, F5 e, D5 q',
  'E5 q, D5 q, C5 h',
  'C5 e, E5 e, G5 q, C6 e, G5 e, E5 q',
  'A5 e, F5 e, C5 q, F5 h',
  'G5 e, F5 e, D5 e, B4 e, D5 q, G5 q',
  'C5 q, G4 q, C5 h',
);

/** One bar of each chord: its three notes for the off-beat chord, and its root and fifth for the bass. */
const CHORDS = {
  C: { arp: ['C4', 'E4', 'G4'], bass: ['C3', 'G3'] },
  F: { arp: ['A3', 'C4', 'F4'], bass: ['F2', 'C3'] },
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G2', 'D3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['C', 'F', 'G', 'C', 'C', 'F', 'G', 'C'];

// the bass knocks on every beat; the chord answers on the off-beat (a rest, then the three notes)
const bass = join(...BARS.map((b) => [0, 1, 0, 1].map((i) => `${CHORDS[b].bass[i]} q`).join(', ')));
const chord = join(
  ...BARS.map(
    (b) =>
      `${CHORDS[b].arp.map((n) => `${n} e`).join(', ')}, ${CHORDS[b].arp[1]} e, ${CHORDS[b].arp[2]} e, ${CHORDS[b].arp[0]} e, ${CHORDS[b].arp[1]} e, ${CHORDS[b].arp[2]} e`,
  ),
);

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(120, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 95), v(2, INSTRUMENTS.pluck, chord, 55)]);
}
