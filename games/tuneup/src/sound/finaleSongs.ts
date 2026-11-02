// The last levels' songs, each its own tune, scored for the music editor's presets
// (web/src/audio/oplPresets.ts):
// - The Test Drive (keys): the 8-track's driving music, 36 bars, whole rounds of the traffic
//   lights' six-bar ring. Round the block, a country-rock tune in G on the piano with a
//   clavinet riff; Main Street, a funky strut in A on the electric piano.
// - The Parade Route: a 6/8 march, a beat a dotted quarter, each scene its own strains and a
//   band section more: the drums, bells and trumpets for the march in C; the tubas, and the
//   kazoos on the tune, for the trio in F; the horns on the tune and the choir for the break
//   strain in D minor and the fireworks strain, which ends on the main theme's motif.
import { bars, comp, grid, score, type Drum, type Part } from './score';

/** The test drive's beat in ticks (two to a light's countdown bar). */
export const DRIVE_BEAT = 9;

const ROAD_A = ['G', 'G', 'C', 'G', 'D', 'C', 'G', 'G', 'Em', 'C', 'D', 'D'];
const ROAD_B = ['C', 'C', 'G', 'G', 'Am', 'D', 'G', 'Em', 'C', 'D', 'G', 'D'];
const BLOCK = [
  'D5e G5e B5e D6q B5e G5q',
  'A5q. G5e E5q D5q',
  'E5e G5e C6e E6q C6e G5q',
  'D6q. B5e G5h',
  'F#5e A5e D6e F#6q D6e A5q',
  'G5q. E5e C5q E5q',
  'D5q G5q B5q D6q',
];
const BLOCK_END = ['E5e G5e B5e E6q B5e G5q', 'C6q. B5e A5q G5q', 'F#5q A5q D6q C6q'];
const BLOCK_B = bars(
  'E6q. D6e C6q G5q',
  'A5q B5q C6h',
  'D6q. B5e G5q D5q',
  'B4q D5q G5h',
  'C6q. B5e A5q E5q',
  'F#5q A5q D6h',
  'B5q. A5e G5q D5q',
  'E5q G5q B5h',
  'C6e B5e A5e G5e E5q C6q',
  'D6e C6e A5e F#5e D5q A5q',
  'G5q B5q D6q G6q',
  'F#6h. rq',
);
const MAIN_A = ['A', 'D', 'A', 'E', 'A', 'D', 'E', 'A'];
const MAIN_B = ['D', 'D', 'A', 'A', 'B7', 'B7', 'E', 'E'];
const STRUT_A = bars(
  'rq C#6e B5e A5q E5q',
  'F#5q. A5e D6h',
  'rq C#6e E6e C#6q A5q',
  'B5h. G#5q',
  'rq C#6e B5e A5q E5q',
  'F#5q A5q D6q A5q',
  'E6q. D6e B5q G#5q',
  'A5h. rq',
);
const STRUT_B = bars(
  'A5q. B5e A5q F#5q',
  'A5q D6q F#6h',
  'E6q. C#6e B5q A5q',
  'E6h C#6h',
  'D#6q. B5e F#5q A5q',
  'D#6q F#6q A6h',
  'G#6q. E6e B5q G#5q',
  'B5h D6h',
);
const STRUT_TAG = bars('C#6q E6q A6h', 'F#6h D6h', 'E6q. B5e G#5q E5q', 'A5h. rq');

/** The Test Drive, part `part` (0 round the block, 1 Main Street). */
export function driveSong(part: number): Uint8Array {
  if (part === 0) {
    const chords = [...ROAD_A, ...ROAD_A, ...ROAD_B];
    return score(
      DRIVE_BEAT,
      4,
      [
        {
          ch: 0,
          patch: 'piano-bright',
          notes: bars(...BLOCK, 'B5h. rq', ...BLOCK_END, 'A5h. rq', ...BLOCK, 'B5h D6h', ...BLOCK_END, 'D6h. rq', BLOCK_B),
          vel: 90,
        },
        { ch: 1, patch: 'clavinet', notes: comp(chords, 4, '8e 5e Re 5e 8e 5e 3e 5e', { bass: 'G3' }), vel: 55 },
        { ch: 2, patch: 'piano-mellow', notes: comp(chords, 4, 'Rq 5q 8q 5q', { bass: 'E2' }), vel: 85 },
        { ch: 3, patch: 'epiano', notes: comp(chords, 4, 'rq Xq rq Xq', { lo: 'G3' }), vel: 45 },
      ],
      [
        { patch: 'kick-punchy', grid: grid(36, 'x...x.x.'), vel: 80 },
        { patch: 'snare-tight', grid: grid(36, '..X...X.'), vel: 70 },
        { patch: 'hat-closed', grid: grid(36, 'xxxxxxxx'), vel: 40 },
      ],
    );
  }
  const chords = [...MAIN_A, ...MAIN_A, ...MAIN_B, ...MAIN_A, 'A', 'D', 'E', 'A'];
  return score(
    DRIVE_BEAT,
    4,
    [
      { ch: 0, patch: 'epiano', notes: bars(STRUT_A, STRUT_A, STRUT_B, STRUT_A, STRUT_TAG), vel: 95 },
      { ch: 1, patch: 'harpsichord', notes: comp(chords, 4, 'rh 3e 5e 8q | rw', { bass: 'A4' }), vel: 45 },
      { ch: 2, patch: 'clavinet', notes: comp(chords, 4, 'Re rs Rs 8e Re 5e Re 3e 5e', { bass: 'E2' }), vel: 90 },
      { ch: 3, patch: 'epiano-round', notes: comp(chords, 4, 'Xs rs re rq Xe re rq', { lo: 'G3' }), vel: 50 },
    ],
    [
      { patch: 'kick-punchy', grid: grid(36, 'x..x..x...x..x..'), vel: 85 },
      { patch: 'snare-tight', grid: grid(36, '....X.......X..o'), vel: 70 },
      { patch: 'hat-closed', grid: grid(36, 'x.x.x.x.x.x.x.x.'), vel: 40 },
    ],
  );
}

/** The parade's beat in ticks: a dotted quarter of the 6/8 march (two to a bar). */
export const PARADE_BEAT = 11;

// a beat is a dotted quarter: q a dotted quarter, u a quarter, t an eighth, h a bar
const MARCH_A = ['C', 'C', 'G7', 'G7', 'G7', 'G7', 'C', 'C', 'C', 'C', 'F', 'F', 'C G7', 'G7', 'C', 'C'];
const MARCH_B = ['Am', 'Am', 'E7', 'E7', 'Am', 'Am', 'D7', 'G7', 'C', 'C', 'G7', 'G7', 'F', 'F', 'G7', 'C'];
const TRIO = ['F', 'F', 'Bb', 'Bb', 'F', 'F', 'C7', 'C7', 'F', 'F', 'Bb', 'Bb', 'F', 'C7', 'F', 'F'];
const KAZOO = ['Dm', 'Dm', 'Gm', 'Gm', 'C7', 'C7', 'F', 'F', 'Bb', 'Bb', 'F', 'D7', 'Gm7', 'C7', 'F', 'F'];
const FIRE = ['C', 'C', 'F', 'F', 'G7', 'G7', 'C', 'C', 'Am', 'Am', 'F', 'G7', 'C', 'C', 'F', 'C'];
const BREAK = ['Dm', 'Dm', 'A7', 'A7', 'Dm', 'Dm', 'A7', 'A7', 'Bb', 'Bb', 'F', 'F', 'G7', 'G7', 'C7', 'C7'];
const STRAIN_A = bars(
  'G4t C5t E5t G5u E5t',
  'C6q G5q',
  'F5t E5t D5t B4u D5t',
  'G5q rq',
  'F5u D5t B4u G4t',
  'D5u F5t A5u G5t',
  'E5u C5t G4u C5t',
  'E5q rq',
  'G4t C5t E5t G5u E5t',
  'C6q E6q',
  'F5t A5t C6t F6u C6t',
  'A5q F5q',
  'E5u G5t D5u F5t',
  'B4q G4q',
  'C5u E5t G5u C6t',
  'C6q rq',
);
const STRAIN_B = bars(
  'E5u A5t C6u A5t',
  'E5q A4q',
  'G#4t B4t D5t E5u D5t',
  'B4q E5q',
  'C5t E5t A5t C6u A5t',
  'E5q C5q',
  'F#5u A5t D6u C6t',
  'B5q G5q',
  'E5u G5t C6u E6t',
  'D6u C6t G5q',
  'F5u D5t B4u D5t',
  'G5q F5q',
  'A5u C6t F6u C6t',
  'A5q F5q',
  'D5u F5t B5u G5t',
  'C6q rq',
);
const STRAIN_TRIO = bars(
  'A4u C5t F5u A5t',
  'C6q A5q',
  'D6u Bb5t F5u D5t',
  'Bb5q F5q',
  'A5u F5t C5u F5t',
  'A5q C6q',
  'Bb5u G5t E5u C5t',
  'G5q E5q',
  'A4u C5t F5u A5t',
  'C6q F6q',
  'D6u F6t D6u Bb5t',
  'F5q D5q',
  'C6u A5t F5u A5t',
  'G5u E5t C5u Bb4t',
  'A4u C5t F5u C5t',
  'F5q rq',
);
const STRAIN_KAZOO = bars(
  'A5u F5t D5u F5t',
  'A5q D6q',
  'Bb5u G5t D5u G5t',
  'Bb5q D6q',
  'C6u Bb5t G5u E5t',
  'G5q C5q',
  'F5u A5t C6u A5t',
  'F5q rq',
  'D6u Bb5t F5u Bb5t',
  'D6q F6q',
  'C6u A5t F5u A5t',
  'F#5q A5q',
  'Bb5u G5t D5u G5t',
  'E5u G5t Bb5u G5t',
  'A5u C6t F6u C6t',
  'F6q rq',
);
/** The fireworks strain, ending on the main theme's motif (its two bars make four of the march's). */
const STRAIN_FIRE = bars(
  'E5u G5t C6u G5t',
  'E6q C6q',
  'F5u A5t C6u A5t',
  'F6q C6q',
  'D6u B5t G5u B5t',
  'F6q D6q',
  'E6u D6t C6u G5t',
  'C6q rq',
  'C6u A5t E5u A5t',
  'C6q E6q',
  'A5u F5t C5u F5t',
  'B5q D6q',
  // the motif, C E G E | F A G
  'C5q E5q',
  'G5q E5q',
  'F5q A5q',
  'G5h',
);
const STRAIN_BREAK = bars(
  'D5t D5t D5t F5u D5t',
  'A5q rq',
  'C#5t C#5t C#5t E5u C#5t',
  'A5q rq',
  'D5t F5t A5t D6u A5t',
  'F5q D5q',
  'E5t G5t C#6t E6u C#6t',
  'A5q rq',
  'D6u Bb5t F5u Bb5t',
  'D6q Bb5q',
  'C6u A5t F5u A5t',
  'C6q A5q',
  'B5u G5t D5u G5t',
  'B5q G5q',
  'C6u Bb5t G5u E5t',
  'C5q rq',
);

/** The Parade Route, scene `part` (0-2): the band so far, a section more each scene, and a strain more of the march. */
export function paradeSong(part: number): Uint8Array {
  const [chords, tune] = [
    [
      [...MARCH_A, ...MARCH_A, ...MARCH_B],
      [STRAIN_A, STRAIN_A, STRAIN_B],
    ],
    [
      [...TRIO, ...KAZOO, ...TRIO],
      [STRAIN_TRIO, STRAIN_KAZOO, STRAIN_TRIO],
    ],
    [
      [...BREAK, ...FIRE, ...BREAK, ...FIRE],
      [STRAIN_BREAK, STRAIN_FIRE, STRAIN_BREAK, STRAIN_FIRE],
    ],
  ][part] as [string[], string[]];
  const n = chords.length;
  const parts: Part[] =
    part === 0
      ? [
          // the fanfare's trumpets on the tune, the bells an octave over it
          { ch: 0, patch: 'trumpet', notes: bars(...tune), vel: 90 },
          { ch: 5, patch: 'glockenspiel', notes: bars(...tune), vel: 40, shift: 12 },
        ]
      : part === 1
        ? [
            // the kazoos take the trio, the trumpets under them, the oom-pah tubas, the bells' sparkle
            { ch: 0, patch: 'kazoo', notes: bars(...tune), vel: 90 },
            { ch: 1, patch: 'trumpet', notes: comp(chords, 2, '3u 5t 3u 5t | 5q 3q', { bass: 'E4' }), vel: 55 },
            { ch: 2, patch: 'tuba', notes: comp(chords, 2, 'Ru rt 5u rt', { bass: 'E2' }), vel: 85 },
            { ch: 5, patch: 'glockenspiel', notes: comp(chords, 2, 'rq 8u rt | rh', { bass: 'C6' }), vel: 40 },
          ]
        : [
            // the horns sing the tune low, the trumpets and kazoos call over them, the choir holds the chords
            { ch: 0, patch: 'horn', notes: bars(...tune), vel: 95, shift: -12 },
            { ch: 1, patch: 'trumpet', notes: comp(chords, 2, 'rt 5t 8t rt 5t 3t | 8u 5t 3u 5t', { bass: 'C5' }), vel: 60 },
            { ch: 2, patch: 'tuba', notes: comp(chords, 2, 'Ru rt 5u rt', { bass: 'E2' }), vel: 85 },
            { ch: 3, patch: 'choir', notes: comp(chords, 2, 'Xh', { lo: 'G3' }), vel: 45, legato: 0.97 },
          ];
  const drums: Drum[] = [
    { patch: 'snare-tight', grid: grid(n, 'x.xx.x'), vel: 65 },
    { patch: 'kick-boomy', grid: grid(n, 'x..x..'), vel: 80 },
  ];
  if (part >= 2) drums.push({ patch: 'crash', grid: grid(n / 16, ['X.....', ...new Array<string>(15).fill('......')].join('|')), vel: 60 });
  return score(PARADE_BEAT, 2, parts, drums);
}
