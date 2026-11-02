// The title, the ending and game over. The title and the ending open on the main theme's
// motif (song.ts MOTIF), the only places besides the wake (the Fan Band's first verse) it is
// heard; around it each has a tune of its own:
// - the title: a showtune two-step in C, AABA, on the stock Game-Maker instruments (the
//   music editor's Classic group, a nod to RSD's originals);
// - the ending: the motif twice and a fanfare, the brass, bells and orchestra all together;
// - game over: a little friendly phrase in F on a music box.
import { bars, comp, grid, score } from './score';
import { MOTIF } from './song';

const SHOW_A = ['C', 'Am7', 'Dm7', 'G7', 'C', 'A7', 'Dm7 G7', 'C'];
const SHOW_B = ['E7', 'Am', 'D7', 'G7', 'F', 'Fm6', 'Em7 A7', 'Dm7 G7'];
const SHOW = ['G4e A4e C5q E5q. D5e', 'C5h rq A4e C5e', 'D5q F5q A5q. G5e', 'F5h. rq', 'E5e F5e G5q C6q. B5e', 'A5h C#5q E5q'];
const TWO_STEP_A1 = bars(...SHOW, 'D5q F5e E5e D5q B4q', 'C5h. rq');
const TWO_STEP_A2 = bars(...SHOW, 'D5q G5e F5e E5q D5q', 'C5w');
const TWO_STEP_B = bars('B4q G#4q B4q D5q', 'C5h. A4q', 'F#5q E5q D5q C5q', 'B4h. G4q', 'A4q C5q F5q A5q', 'Ab5h F5h', 'E5q G5q C#5q E5q', 'D5q F5q G5h');

/** The title and the menus: the motif on the brass, then a two-step on the Classic lead, a bell's answers, the Classic bass and piano. */
export function menuSong(): Uint8Array {
  const chords = ['C', 'F C', ...SHOW_A, ...SHOW_A, ...SHOW_B, ...SHOW_A];
  return score(
    9,
    4,
    [
      { ch: 0, patch: 'lead', notes: bars('rw', 'rw', TWO_STEP_A1, TWO_STEP_A2, TWO_STEP_B, TWO_STEP_A2), vel: 90 },
      { ch: 1, patch: 'brass', notes: bars(MOTIF, comp(chords.slice(2), 4, 'rw | rh 3e 5e 8q | rw | rw', { bass: 'C5' })), vel: 70 },
      { ch: 2, patch: 'bass', notes: comp(chords, 4, 'Rh 5h | Rq 3q 5q 8q', { bass: 'E2' }), vel: 90 },
      { ch: 3, patch: 'piano', notes: comp(chords, 4, 'rq Xq rq Xq', { lo: 'G3' }), vel: 55 },
    ],
    [
      { patch: 'kick-punchy', grid: grid(34, 'x...x...'), vel: 70 },
      { patch: 'snare-tight', grid: grid(34, '..x...x.'), vel: 55 },
      { patch: 'hat-pedal', grid: grid(34, 'x.x.x.x.'), vel: 40 },
    ],
  );
}

const FINALE = ['C', 'F C', 'Am', 'F', 'Dm7', 'G7', 'C', 'F G7', 'C', 'F C', 'Am', 'F', 'Dm7', 'G7', 'C', 'C'];

/** The ending: the motif and a fanfare that climbs to a held high C, the whole band. */
export function wonSong(): Uint8Array {
  const tune = bars(
    MOTIF,
    'E5q. F5e G5q A5q',
    'C6h A5h',
    'F5q. G5e A5q D6q',
    'B5h G5h',
    'C6q G5q E6q C6q',
    'A5q F5q D5q B4q',
    MOTIF,
    'A5q C6q E6q A6q',
    'F6h. C6q',
    'D6q F6q A6q F6q',
    'G6h. F6q',
    'E6w',
    'C6w',
  );
  return score(
    9,
    4,
    [
      { ch: 0, patch: 'trumpet', notes: tune, vel: 100 },
      { ch: 1, patch: 'glockenspiel', notes: tune, vel: 40, shift: 12 },
      { ch: 2, patch: 'tuba', notes: comp(FINALE, 4, 'Rq 5q Rq 5q', { bass: 'E2' }), vel: 85 },
      { ch: 3, patch: 'orchestra', notes: comp(FINALE, 4, 'Xh Xh', { lo: 'G3' }), vel: 55 },
    ],
    [
      { patch: 'snare-tight', grid: grid(14, 'x.x.x.x.') + '|oooooooooooooooo|X...............', vel: 60 },
      { patch: 'crash', grid: grid(14, '........') + '|................|X...............', vel: 70 },
    ],
  );
}

/** Game over: a little phrase on a lone music box, slow, with a vibraphone's soft chords. Even this is friendly. */
export function lostSong(): Uint8Array {
  const chords = ['F', 'Bb F', 'Gm C', 'F'];
  return score(14, 4, [
    { ch: 0, patch: 'music-box', notes: bars('A5q G5q F5q C5q', 'D5q E5q F5h', 'Bb4q C5q D5q E5q', 'F5w'), vel: 80 },
    { ch: 3, patch: 'vibraphone', notes: comp(chords, 4, 'Xw | Xh Xh | Xh Xh | Xw', { lo: 'F3' }), vel: 35 },
  ]);
}
