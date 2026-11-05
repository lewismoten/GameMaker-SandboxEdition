// LOOKS LIKE A WALL's one song, "Tiptoe": eight bars of a sneaky, bouncy tune in A minor for the
// Sound Blaster (a lead, a bass that tiptoes on the beat and a plucked off-beat chord, each its
// own FM channel). It plays on the title, the menu, the levels and the endings. Note strings are
// the kit's (kit/tune.ts): a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'A4 e, C5 e, E5 q, A5 e, E5 e, C5 q',
  'F4 e, A4 e, C5 q, F5 h',
  'G4 e, B4 e, D5 q, G5 e, D5 e, B4 q',
  'E5 q, C5 q, A4 h',
  'A4 e, C5 e, E5 q, A5 e, E5 e, C5 q',
  'F5 e, A5 e, C6 q, A5 h',
  'G5 e, E5 e, D5 e, B4 e, G4 q, B4 q',
  'A4 q, E4 q, A4 h',
);

/** One bar of each chord: its three notes for the off-beat chord, and its root and fifth for the bass. */
const CHORDS = {
  A: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
  F: { arp: ['A3', 'C4', 'F4'], bass: ['F2', 'C3'] },
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G2', 'D3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['A', 'F', 'G', 'A', 'A', 'F', 'G', 'A'];

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
