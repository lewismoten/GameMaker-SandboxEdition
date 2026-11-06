// BOOTS AND JET PACK's one song, "Spring Heel": eight bars of a springy, climbing tune in D major for the Sound
// Blaster (a lead that wanders, a walking bass and a plucked chord on the off-beat, each its own FM
// channel). It plays on the title, the menu, the levels and the endings. Note strings are the kit's
// (kit/tune.ts): a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'D5 e, F#5 e, A5 q, F#5 e, A5 e, D6 q',
  'D6 e, B5 e, A5 q, F#5 e, A5 e, B5 q',
  'B5 q, D6 e, B5 e, G5 q, B5 q',
  'A5 e, F#5 e, E5 q, A5 h',
  'D5 e, F#5 e, A5 q, D6 e, F#6 e, A5 q',
  'B5 e, D6 e, F#6 q, D6 e, B5 e, F#5 q',
  'G5 q, B5 e, D6 e, G6 q, D6 q',
  'E6 q, C#6 q, A5 h',
);

/** One bar of each chord: its three notes for the off-beat chord, and its root and fifth for the bass. */
const CHORDS = {
  D: { arp: ['D4', 'F#4', 'A4'], bass: ['D3', 'A3'] },
  Bm: { arp: ['B3', 'D4', 'F#4'], bass: ['B2', 'F#3'] },
  G: { arp: ['B3', 'D4', 'G4'], bass: ['G2', 'D3'] },
  A: { arp: ['A3', 'C#4', 'E4'], bass: ['A2', 'E3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['D', 'D', 'Bm', 'A', 'D', 'Bm', 'G', 'A'];

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
  return tune(112, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 95), v(2, INSTRUMENTS.pluck, chord, 55)]);
}
