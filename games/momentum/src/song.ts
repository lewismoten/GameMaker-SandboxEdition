// SLIDE AND DRIFT's one song, "Full Tilt": a running chip tune in A major in its group's band
// (kit/starter/songStyle.ts: a square lead with its octave above, a bass in eighths and a busy beat), an A and a B
// section played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('moving', {
    bpm: 148,
    A: {
      chords: 'A | A | G | D | A | A | G | E',
      tune: 'A4 e, A4 e, C#5 e, E5 e, A5 q, E5 q | G5 e, F#5 e, E5 e, C#5 e, E5 h | D5 e, D5 e, G5 e, D5 e, B4 q, D5 q | A4 e, B4 e, D5 e, F#5 e, A5 h | A4 e, A4 e, C#5 e, E5 e, A5 q, B5 q | C#6 e, B5 e, A5 e, G5 e, E5 h | G5 e, A5 e, B5 e, G5 e, D5 q, B4 q | E5 h, G#4 h',
    },
    B: {
      chords: 'D | D | A | A | F#m | D | E | E',
      tune: 'F#5 q, A5 e, F#5 e, D5 q, A4 q | B4 e, D5 e, F#5 e, A5 e, F#5 h | E5 q, C#5 e, E5 e, A5 q, E5 q | C#5 e, E5 e, A5 e, C#6 e, A5 h | F#5 e, F#5 e, A5 e, C#6 e, F#6 q, C#6 q | D6 e, C#6 e, B5 e, A5 e, F#5 h | E5 e, G#5 e, B5 e, E6 e, D6 q, B5 q | G#5 q, E5 q, B4 h',
    },
  });
}
