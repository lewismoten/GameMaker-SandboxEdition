// DIG IT's one song, "Footpath": a sunny little march in D major in its group's band (kit/starter/songStyle.ts: piano
// over an oom-pah pluck and a light kick), an A and a B section played AABA, 32 bars before it loops. It plays on the
// title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 124,
    A: {
      chords: 'D | G | D | A | Bm | G | A | D',
      tune: 'D5 e, E5 e, F#5 e, G5 e, A5 q, F#5 q | B5 q, A5 q, G5 h | F#5 e, G5 e, A5 e, F#5 e, D5 q, F#5 q | E5 h., r q | F#5 q, B5 q, B5 e, A5 e, F#5 q | G5 q, B5 q, D6 h | C#6 q, B5 q, A5 q, G5 q | F#5 h., r q',
    },
    B: {
      chords: 'G | D | G | A | Em | D | E | A',
      tune: 'D6 q, D6 q, B5 q, G5 q | A5 q, F#5 q, D5 h | G5 e, A5 e, B5 e, C#6 e, D6 q, B5 q | A5 w | G5 q, B5 q, E6 q, D6 q | C#6 q, A5 q, F#5 h | G#5 q, B5 q, E6 q, D6 q | C#6 h, E5 h',
    },
  });
}
