// EVERYBODY TALKS' one song, "Chatter": eight bars of a chatty tune in G major for the Sound
// Blaster (a lead that asks and answers itself, a bass and a plucked arpeggio, each its own FM
// channel). It plays on the title, the menu, the levels and the endings. Note strings are the
// kit's (kit/tune.ts): a note, an octave and a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'G5 e, A5 e, B5 q, D6 q, B5 q',
  'A5 e, G5 e, E5 q, G5 h',
  'C6 e, B5 e, A5 q, E5 q, G5 q',
  'F#5 e, G5 e, A5 q, D5 h',
  'B5 e, B5 e, D6 q, B5 q, G5 q',
  'A5 q, C6 q, B5 h',
  'E5 q, G5 q, A5 q, C6 q',
  'B5 q, A5 q, G5 h',
);

/** One bar of each chord: its three notes for the arpeggio, and its root and fifth for the bass. */
const CHORDS = {
  G: { arp: ['G3', 'B3', 'D4'], bass: ['G3', 'D3'] },
  E: { arp: ['E3', 'G3', 'B3'], bass: ['E3', 'B3'] },
  C: { arp: ['E3', 'G3', 'C4'], bass: ['C3', 'G3'] },
  D: { arp: ['D3', 'F#3', 'A3'], bass: ['D3', 'A3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['G', 'E', 'C', 'D', 'G', 'C', 'C', 'G'];

const arp = join(...BARS.map((b) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => `${CHORDS[b].arp[i]} e`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return tune(120, [v(0, INSTRUMENTS.lead, MELODY, 100), v(1, INSTRUMENTS.bass, bass, 90), v(2, INSTRUMENTS.pluck, arp, 60)]);
}
