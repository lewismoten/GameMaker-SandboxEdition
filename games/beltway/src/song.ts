// TO THE HORIZON's one song, "Merge Left": a showtime tune in D major in its group's band (kit/starter/songStyle.ts:
// brass doubled below, a pumping bass, string stabs and a crash on every section), an A and a B section played AABA,
// 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 136,
    A: {
      chords: 'D | D | G | A | D | Bm | G A | D',
      tune: 'D5 q, F#5 e, A5 e, D6 q, A5 q | C#6 e, B5 e, A5 q, F#5 h | G5 q, B5 e, D6 e, G6 q, D6 q | A5 e, B5 e, C#6 e, D6 e, E6 h | F#6 q, E6 e, D6 e, A5 q, F#5 q | B5 q, D6 e, B5 e, F#5 h | G5 q, B5 q, A5 q, C#6 q | D6 h., r q',
    },
    B: {
      chords: 'G | D | Em | A | G | D | E | A',
      tune: 'B5 q., D6 e, G6 h | F#6 q., D6 e, A5 h | G5 e, B5 e, E6 e, G6 e, E6 q, B5 q | C#6 w | B5 q., G5 e, D6 h | A5 q., F#5 e, D5 h | G#5 q, B5 q, E6 q, G#5 q | A5 h, C#6 h',
    },
  });
}
