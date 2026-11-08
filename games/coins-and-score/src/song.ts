// COINS AND SCORE's one song, "Penny Parade": a sunny march in F major in the Basics' band (kit/starter/songStyle.ts:
// piano over an oom-pah pluck and a light kick), an A and a B section played AABA, 32 bars before it loops. It plays on
// the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 128,
    A: {
      chords: 'F | F | Bb | F | Gm | C | F | C',
      tune: 'F5 q, A5 q, C6 q, A5 q | G5 e, A5 e, Bb5 q, A5 h | D6 q, C6 q, Bb5 q, D6 q | C6 h, A5 h | Bb5 q, G5 e, A5 e, Bb5 q, D6 q | C6 q, Bb5 q, A5 q, G5 q | A5 q, F5 q, A5 q, C6 q | G5 h., r q',
    },
    B: {
      chords: 'Bb | F | Bb | C | Dm | Bb | Gm C | F',
      tune: 'D6 q., C6 e, Bb5 h | A5 q., G5 e, F5 h | D6 e, D6 e, C6 q, Bb5 q, D6 q | C6 w | F6 q, E6 q, D6 q, A5 q | Bb5 q, C6 q, D6 h | G5 q, Bb5 q, A5 q, G5 q | F5 h., r q',
    },
  });
}
