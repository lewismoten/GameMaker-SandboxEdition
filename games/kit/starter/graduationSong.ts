// The graduations' one song, "Up the Aisle": a slow, proud processional in F major for the Sound Blaster (a
// brass-like lead, a walking bass and a plucked two-beat chord, each its own FM channel), eight bars long. It plays
// on the title, the menu, the hall and the endings. Note strings are the kit's (kit/tune.ts): a note, an octave and
// a length (w h q e), as in "E5 q".
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import type { Graduation } from './graduationConfig';
import { join, tune, v } from '@lewismoten/gamemaker-sandbox-tools/kit/tune';

const MELODY = join(
  'F5 q, F5 e, G5 e, A5 h',
  'G5 q, G5 e, A5 e, Bb5 h',
  'A5 q, C6 q, A5 q, F5 q',
  'G5 q, E5 q, F5 h',
  'C6 q, C6 e, Bb5 e, A5 h',
  'Bb5 q, Bb5 e, A5 e, G5 h',
  'A5 q, F5 q, G5 q, E5 q',
  'F5 w',
);

/** One bar of each chord: its notes for the plucked chord, and its root and fifth for the bass. */
const CHORDS = {
  F: { chord: ['A4', 'C5', 'F5'], bass: ['F3', 'C4'] },
  C: { chord: ['G4', 'C5', 'E5'], bass: ['C3', 'G3'] },
  B: { chord: ['Bb4', 'D5', 'F5'], bass: ['Bb2', 'F3'] },
} as const;
const BARS: (keyof typeof CHORDS)[] = ['F', 'B', 'F', 'C', 'F', 'B', 'C', 'F'];

const pluck = join(...BARS.map((b) => [0, 1, 2, 1].map((i) => `${CHORDS[b].chord[i]} q`).join(', ')));
const bass = join(...BARS.map((b) => CHORDS[b].bass.map((n) => `${n} h`).join(', ')));

/** The song as a .CMF file, at the game's tempo, in its lead voice and key. */
export function song(o: Graduation['song'] = { bpm: 88, lead: 'lead', transpose: 0 }): Uint8Array {
  const t = o.transpose;
  return tune(o.bpm, [v(0, INSTRUMENTS[o.lead], MELODY, 100, t), v(1, INSTRUMENTS.bass, bass, 90, t), v(2, INSTRUMENTS.pluck, pluck, 55, t)]);
}
