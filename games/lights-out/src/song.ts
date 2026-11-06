// LIGHTS OUT's one song, written for this game: a slow, hushed tune in D minor for the Sound Blaster (a lead that
// drips a few notes and rests, a low bass and a plucked arpeggio, each its own FM channel), eight bars that repeat. It
// plays on the title, the menu, the levels and the endings. Note strings are the kit's (kit/tune.ts): a note, an octave
// and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'D5 h, A4 q, F4 q',
  'E5 h, C5 q, A4 q',
  'D5 q, F5 q, E5 q, D5 q',
  'A4 w',
  'F5 h, D5 q, A4 q',
  'G5 h, E5 q, C5 q',
  'D5 q, C5 q, A4 q, F4 q',
  'D4 w',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  Dm: { arp: ['D4', 'F4', 'A4'], bass: ['D2', 'A2'] },
  C: { arp: ['E4', 'G4', 'C5'], bass: ['C2', 'G2'] },
  Bb: { arp: ['D4', 'F4', 'Bb4'], bass: ['Bb1', 'F2'] },
  A: { arp: ['E4', 'A4', 'C#5'], bass: ['A1', 'E2'] },
  Gm: { arp: ['D4', 'G4', 'Bb4'], bass: ['G1', 'D2'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['Dm', 'C', 'Bb', 'A', 'Dm', 'Gm', 'Bb', 'Dm'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} q`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(76, [v(0, INSTRUMENTS.lead, MELODY, 90), v(1, INSTRUMENTS.bass, bass, 80), v(2, INSTRUMENTS.pluck, arp, 55)]);
}
