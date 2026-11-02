// The dream's own songs (levels 1, 2 and 4, and the swim), each its own tune in its own key,
// meter and form, scored for one group of the music editor's presets (web/src/audio/oplPresets.ts):
// - Jump Start: a jump blues in F, three twelve-bar choruses with a shuffle, for the brass.
// - Spark Plucks: a jig in A minor, 6/8, three strains played twice, for the strings.
// - Oil's Well: a slow, slick blues in G, three choruses in a triplet swing, for the woodwinds.
// - The swim: a dreamy waltz in E-flat, AABA, for the synth pads.
import { bars, comp, grid, score } from './score';

const J = ['F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'D7', 'Gm7', 'C7', 'F7 D7', 'Gm7 C7'];
const JUMP_HEAD = [
  'F4u A4t C5u D5t Eb5u D5t C5q',
  'D5u C5t Bb4q rh',
  'F4u A4t C5u D5t F5u Eb5t D5u C5t',
  'A4h rq C5q',
  'Bb4u D5t F5u G5t Ab5u G5t F5q',
  'D5u F5t D5q rh',
  'C5u F5t A5u F5t C6u A5t F5q',
  'F#5h rq A4q',
  'Bb4u D5t G5u F5t D5u Bb4t G4q',
  'E5u G5t Bb5u G5t E5q C5q',
  'F5q C5q A4q F#4q',
  'G4q Bb4q C5q rq',
];
const JUMP_HIGH = [
  'C6q. A5e rq C6q',
  'Ab5u G5t F5u D5t F5h',
  'C6q. A5e rq C6q',
  'A5u G5t F5u Eb5t C5h',
  'D6q. Bb5e rq D6q',
  'Db6u Bb5t Ab5u F5t Ab5h',
  'C6q. A5e rq C6q',
  'A5u F#5t D5q rh',
  'G5u Bb5t D6u Bb5t G5h',
  'Bb5u G5t E5u C5t Bb4h',
  'A4u C5t F5u A5t F#5u A5t D6q',
  'C6h. rq',
];

/** Jump Start: the garage at dawn, a brisk jump blues on the trumpet, the trombone answering, a tuba walking. */
export function jumpSong(): Uint8Array {
  const chords = [...J, ...J, ...J];
  return score(
    8,
    4,
    [
      { ch: 0, patch: 'trumpet', notes: bars(...JUMP_HEAD, ...JUMP_HIGH, ...JUMP_HEAD.slice(0, 11), 'F5q C5q F4h'), vel: 95 },
      { ch: 1, patch: 'trombone', notes: comp(chords, 4, 'rh 5u 7t 8q | rw | rh 5u 3t Rq | rh. 8q', { bass: 'F3' }), vel: 70 },
      { ch: 2, patch: 'tuba', notes: comp(chords, 4, 'Rq 3q 5q 7q | 8q 7q 5q 3q', { bass: 'E2' }), vel: 90 },
      { ch: 3, patch: 'horn', notes: comp(chords, 4, 'rq Xu Xt rq Xq', { lo: 'G3' }), vel: 55 },
    ],
    [
      { patch: 'kick-punchy', grid: grid(36, 'x.....x.....'), vel: 80 },
      { patch: 'snare-tight', grid: grid(36, '...x.....x..'), vel: 70 },
      { patch: 'hat-closed', grid: grid(36, 'x.xx.xx.xx.x'), vel: 50 },
    ],
  );
}

const SPARK_A = ['Am', 'G', 'Am', 'Em', 'Am', 'G', 'F E', 'Am'];
const SPARK_B = ['C', 'G', 'Am', 'Em', 'F', 'C', 'Dm E', 'Am'];
const SPARK_C = ['Dm', 'Am', 'G', 'C', 'F', 'Dm', 'E', 'E7'];
const JIG_A = bars(
  'E5q A5q A5q E5q A5q B5q',
  'D6q B5q G5q D5q G5q B5q',
  'C6q B5q A5q E5q A5q C6q',
  'B5h G5q E5h.',
  'E5q A5q A5q E5q A5q B5q',
  'D6q E6q D6q B5q G5q B5q',
  'A5q G5q F5q E5q G#5q B5q',
  'A5h. rh.',
);
const JIG_B = bars(
  'E6q D6q C6q G5q C6q E6q',
  'D6q C6q B5q G5q B5q D6q',
  'C6q B5q A5q E5q A5q C6q',
  'B5q A5q G5q E5q G5q B5q',
  'A5q C6q F6q E6q C6q A5q',
  'G5q C6q E6q G6h E6q',
  'F6q E6q D6q B5q G#5q E5q',
  'A5h. rh.',
);
const JIG_C = bars(
  'F5h A5q D6h A5q',
  'C6h A5q E5h A5q',
  'B5h G5q D5h G5q',
  'C6h. E6h.',
  'F6h E6q D6h C6q',
  'A5h F5q D5h F5q',
  'E5q G#5q B5q E6q D6q B5q',
  'G#5h. E5h.',
);

/** Spark Plucks: a jig in 6/8 (an eighth a beat), the fiddle on the tune, a harp running the chords, pizzicato and guitar under it. */
export function sparkSong(): Uint8Array {
  const chords = [...SPARK_A, ...SPARK_A, ...SPARK_B, ...SPARK_B, ...SPARK_C, ...SPARK_C];
  return score(4, 6, [
    { ch: 0, patch: 'violin', notes: bars(JIG_A, JIG_A, JIG_B, JIG_B, JIG_C, JIG_C), vel: 85 },
    { ch: 1, patch: 'harp', notes: comp(chords, 6, 'Rq 3q 5q 8q 5q 3q', { bass: 'A3' }), vel: 60 },
    { ch: 2, patch: 'pizzicato', notes: comp(chords, 6, 'Rh 5q Rh 5q', { bass: 'E2' }), vel: 85 },
    { ch: 3, patch: 'guitar-nylon', notes: comp(chords, 6, 'rq Xq Xq rq Xq Xq', { lo: 'G3' }), vel: 45 },
  ]);
}

const OIL = ['G7', 'Cmaj7', 'G7', 'G7', 'Cmaj7', 'Cmaj7', 'G7', 'Em7', 'Am7', 'D7', 'G7 Em7', 'Am7 D7'];
const OIL_LOW = [
  'D5u B4t D5h.',
  'E5u D5t B4u G4t E4h',
  'G4u B4t D5u F5t E5u D5t B4q',
  'D5w',
  'G5u E5t G5h.',
  'B5u G5t E5u D5t C5h',
  'B4u D5t G5u F5t D5h',
  'E5h. rq',
  'C5u E5t G5u E5t A5h',
  'F#5u E5t D5u C5t A4h',
  'B4h G4u B4t E5q',
  'C5h rh',
];
const OIL_HIGH = bars(
  'rq B5u A5t G5u F5t D5q',
  'E5h. G5q',
  'B5u A5t G5u F5t E5u D5t B4q',
  'G5w',
  'rq C6u B5t G5u E5t C6q',
  'B5h. G5q',
  'F5u D5t B4u G4t F5u D5t B4q',
  'G5h E5h',
  'A5u G5t E5u C5t E5u G5t A5q',
  'C6h A5q F#5q',
  'G5h B5h',
  'A5h. rq',
);

/** Oil's Well: slow and slick, the sax on a lazy blues, a flute's fills, a reed bass, clarinets holding the chords. */
export function oilSong(): Uint8Array {
  const chords = [...OIL, ...OIL, ...OIL];
  return score(13, 4, [
    { ch: 0, patch: 'sax', notes: bars(...OIL_LOW, OIL_HIGH, ...OIL_LOW.slice(0, 11), 'A4h F#4h'), vel: 85 },
    { ch: 1, patch: 'flute', notes: comp(chords, 4, 'rw | rh. 5u 3t | rw | rh 8u 5t 3q', { bass: 'C5' }), vel: 55 },
    { ch: 2, patch: 'reed-soft', notes: comp(chords, 4, 'Rq 5q 8q 5q', { bass: 'E2' }), vel: 95 },
    { ch: 3, patch: 'clarinet', notes: comp(chords, 4, 'Xh Xh', { lo: 'F3' }), vel: 40, legato: 0.97 },
  ]);
}

const SWIM_A = ['Eb', 'Cm', 'Abmaj7', 'Bb', 'Eb', 'Gm', 'Ab', 'Bb7'];
const SWIM_B = ['Cm', 'Gm', 'Ab', 'Eb', 'Fm7', 'Bb', 'Fm', 'Bb7'];
const DRIFT_A = bars('G5h Bb5q', 'C6h.', 'Bb5q Ab5q G5q', 'F5h.', 'Eb5q G5q Bb5q', 'D6h Bb5q', 'C6q Bb5q Ab5q', 'G5h F5q');
const DRIFT_B = bars('Eb6h D6q', 'D6h Bb5q', 'C6h Ab5q', 'G5h.', 'Ab5q C6q Eb6q', 'D6h.', 'C6q Ab5q F5q', 'D5h.');
const DRIFT_END = bars('G5h Bb5q', 'C6h.', 'Bb5q Ab5q G5q', 'F5h.', 'Eb5q G5q Bb5q', 'D6h Bb5q', 'C6q Ab5q F5q', 'Bb4h.');

/** The swim: a dreamy waltz on a soft synth lead over wobbling pads, bubbles blipping high, a deep pad for a bass. */
export function swimSong(): Uint8Array {
  const chords = [...SWIM_A, ...SWIM_A, ...SWIM_B, ...SWIM_A];
  return score(16, 3, [
    { ch: 0, patch: 'lead-bright', notes: bars(DRIFT_A, DRIFT_A, DRIFT_B, DRIFT_END), vel: 70 },
    { ch: 1, patch: 'lead-square', notes: comp(chords, 3, 'rh 8e 5e | rh. | rq 5e 8e rq | rh.', { bass: 'Eb6' }), vel: 35 },
    { ch: 2, patch: 'pad-sweep', notes: comp(chords, 3, 'Rh.', { bass: 'Eb2' }), vel: 60, legato: 0.98 },
    { ch: 3, patch: 'pad-wobble', notes: comp(chords, 3, 'rq Xh', { lo: 'G3' }), vel: 40 },
  ]);
}
