// HEAT WAVES' one song, "Long Hot Road": eight lazy bars in A minor for the Sound Blaster (a lead,
// a bass and a plucked arpeggio, each its own FM channel), slow, with long notes that hang like the
// heat. It plays on the title, the menu, the levels and the endings. Note strings are the kit's
// (kit/tune.ts): a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join('E5 h, D5 q, C5 q', 'A4 w', 'C5 q, D5 q, E5 q, G5 q', 'E5 w', 'A5 h, G5 q, E5 q', 'D5 h, C5 h', 'B4 q, C5 q, D5 q, B4 q', 'A4 w');

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  Am: { arp: ['A3', 'C4', 'E4'], bass: ['A2', 'E3'] },
  C: { arp: ['G3', 'C4', 'E4'], bass: ['C3', 'G2'] },
  F: { arp: ['A3', 'C4', 'F4'], bass: ['F2', 'C3'] },
  G: { arp: ['G3', 'B3', 'D4'], bass: ['G2', 'D3'] },
  E: { arp: ['G#3', 'B3', 'E4'], bass: ['E2', 'B2'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['Am', 'Am', 'C', 'C', 'F', 'G', 'E', 'Am'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} q`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(76, [v(0, INSTRUMENTS.lead, MELODY, 96), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 56)]);
}
