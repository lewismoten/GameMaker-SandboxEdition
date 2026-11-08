// HERE TODAY's one song, "Here and Gone": a driving minor tune in B minor in its group's band
// (kit/starter/songStyle.ts: a lead doubled an octave down, a pumping bass, strings and a stomping beat), an A and a
// B section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('foes', {
    bpm: 130,
    A: {
      chords: 'Bm | G | D | F# | Bm | G | Em | F#',
      tune: 'B4 q, D5 e, F#5 e, B5 q, F#5 q | G5 q, B5 e, D6 e, B5 h | A5 q, F#5 e, D5 e, A5 q, D6 q | C#6 h., A#5 q | B5 q, D6 e, B5 e, F#5 q, B5 q | D6 e, C#6 e, B5 e, A5 e, G5 h | E5 q, G5 e, B5 e, E6 q, D6 q | C#6 h., r q',
    },
    B: {
      chords: 'G | A | D | Bm | G | A | F# | F#',
      tune: 'D6 h, B5 q, G5 q | E6 h, C#6 q, A5 q | F#6 e, E6 e, D6 e, A5 e, F#5 q, A5 q | B5 h, F#5 h | G5 e, B5 e, D6 e, G6 e, F#6 q, D6 q | E6 e, D6 e, C#6 e, A5 e, E5 h | F#5 q, A#5 q, C#6 q, E6 q | C#6 h, A#5 h',
    },
  });
}
