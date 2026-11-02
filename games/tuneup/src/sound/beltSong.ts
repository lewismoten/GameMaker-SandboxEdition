// The Beltway's song: what the 8-track plays on the ring road, a breezy soft-rock cruise in
// E-flat, 4/4, AABA (32 bars), for the woodwinds (web/src/audio/oplPresets.ts): the sax on the
// tune, a flute answering it, the clarinet's off-beat chords and the soft reed down low, over
// the drum kit. A beat is BELT_BEAT ticks, the dash's PLAY lamp's blink.
import { bars, comp, grid, score } from './score';

/** The Beltway's beat in ticks (the 8-track's PLAY lamp blinks once a beat). */
export const BELT_BEAT = 9;

const A = ['Eb', 'Cm', 'Ab', 'Bb', 'Eb', 'Cm', 'Fm', 'Bb'];
const A_END = ['Eb', 'Cm', 'Ab', 'Bb', 'Eb', 'Cm', 'Fm', 'Eb'];
const B = ['Ab', 'Bb', 'Gm', 'Cm', 'Ab', 'Bb', 'Eb', 'Bb'];
const TUNE_A = ['G5q. F5e Eb5q Bb4q', 'C5q Eb5q G5h', 'Ab5q. G5e F5q Eb5q', 'F5h. rq', 'G5q. F5e Eb5q G5q', 'Bb5q. G5e Eb5q C5q', 'Ab5q G5q F5q Eb5q'];
const TUNE_B = [
  'C6q. Bb5e Ab5q Eb5q',
  'D6q. C6e Bb5h',
  'Bb5q G5q D5q G5q',
  'Eb6h. rq',
  'C6q Ab5q Eb5q Ab5q',
  'Bb5q. Ab5e G5q F5q',
  'G5q Bb5q Eb6q G5q',
  'F5h. rq',
];

export function beltSong(): Uint8Array {
  const chords = [...A, ...A_END, ...B, ...A_END];
  return score(
    BELT_BEAT,
    4,
    [
      { ch: 0, patch: 'sax', notes: bars(...TUNE_A, 'F5h. rq', ...TUNE_A, 'Eb5h. rq', ...TUNE_B, ...TUNE_A, 'Eb5h. rq'), vel: 95 },
      { ch: 1, patch: 'flute', notes: comp(chords, 4, 'rh. 5e 8e', { bass: 'Eb5' }), vel: 50 },
      { ch: 2, patch: 'clarinet', notes: comp(chords, 4, 'rq Xq rq Xq', { lo: 'G3' }), vel: 50 },
      { ch: 3, patch: 'reed-soft', notes: comp(chords, 4, 'Rq. Re 5q Rq', { bass: 'Eb2' }), vel: 85 },
    ],
    [
      { patch: 'kick-punchy', grid: grid(32, 'x...x.x.'), vel: 75 },
      { patch: 'snare-tight', grid: grid(32, '..X...X.'), vel: 60 },
      { patch: 'hat-closed', grid: grid(32, 'x.x.x.x.'), vel: 35 },
    ],
  );
}
