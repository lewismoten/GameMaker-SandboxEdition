// LIGHTNING BUGS' one song, "Long Grass at Dusk": eight slow bars in F major for the Sound Blaster (a bell for the tune, a bass and a
// soft plucked arpeggio, each its own FM channel), written for this game. It plays on the title, the menu, the levels and the
// endings. Note strings are the kit's (kit/tune.ts): a note, an octave and a length (w h q e, a dot for half as long again).
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'A4 h, C5 q, F5 q',
  'E5 h., D5 q',
  'D5 q, C5 q, A4 h',
  'Bb4 h, G4 h',
  'A4 q, C5 q, F5 q, A5 q',
  'G5 h, E5 h',
  'F5 q, D5 q, C5 q, Bb4 q',
  'A4 w',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  F: { arp: ['F3', 'A3', 'C4'], bass: ['F2', 'C3'] },
  C: { arp: ['E3', 'G3', 'C4'], bass: ['C3', 'G2'] },
  Dm: { arp: ['D3', 'F3', 'A3'], bass: ['D3', 'A2'] },
  Bb: { arp: ['D3', 'F3', 'Bb3'], bass: ['Bb2', 'F2'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'F'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} q`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(76, [v(0, INSTRUMENTS.bell, MELODY, 90), v(1, INSTRUMENTS.bass, bass, 80), v(2, INSTRUMENTS.pluck, arp, 50)]);
}
