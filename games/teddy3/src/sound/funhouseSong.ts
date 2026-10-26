// Level 11's song, the funhouse: a wobbly carnival. Teddy's Theme on the calliope over an
// oompah bass, then a new middle of its own where every phrase slips a half step and back
// (like walking past the wavy mirrors) and the chords lurch to the flat side, then the theme
// again. A wood-block tick on the off-beats keeps the boards' beat.
import { arrange, TEDDY } from './music';
import { CALLIOPE, SNAP, join, organ, times } from './tunes';
import { THEME_CHORDS } from './themes';

/** The new middle: eight bars, each wobbling a half step under its first note. */
const WOBBLE =
  'G5 e, F#5 e, G5 e, E5 e, C5 q, E5 q, ' +
  'Eb5 e, D5 e, Eb5 e, C5 e, Ab4 h, ' +
  'A5 e, G#5 e, A5 e, F5 e, C5 q, F5 q, ' +
  'G5 q., F5 e, D5 q, B4 q, ' +
  'C6 e, B5 e, C6 e, G5 e, E5 q, G5 q, ' +
  'G5 e, F#5 e, G5 e, Eb5 e, Bb4 h, ' +
  'F5 e, E5 e, F5 e, A5 e, D6 q, C6 q, ' +
  'B5 q, G5 q, D5 q, r q';
const WOBBLE_CHORDS = ['C', 'Ab', 'F', 'G7', 'C', 'Eb', 'Dm', 'G7'];

export function funhouseSong(): Uint8Array {
  const chords = [...THEME_CHORDS, ...WOBBLE_CHORDS, ...THEME_CHORDS];
  return arrange({
    bpm: 126,
    mel: join(TEDDY, WOBBLE, TEDDY),
    chords,
    lead: CALLIOPE,
    comp: organ,
    rhythm: 'r q r q',
    style: 'oompah',
    extra: [SNAP, times(chords.length, 'r e, C5 e, r e, C5 e, r e, C5 e, r e, C5 e'), 45],
  });
}
