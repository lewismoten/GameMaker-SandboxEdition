// SLOW COMPUTERS's one song, "Turbo Off": a showtime tune in A minor in its group's band (kit/starter/songStyle.ts:
// brass doubled below, a pumping bass, string stabs and a crash on every section), an A and a B section played AABA,
// 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 124,
    A: {
      chords: 'Am | F | C | G | Am | F | Dm | E',
      tune: 'E5 q, A5 e., B5 s, C6 h | A5 q, F5 e., A5 s, C6 h | G5 q, E5 e., G5 s, C6 q, E6 q | D6 h., r q | E6 q, C6 e., A5 s, E5 h | F5 q, A5 e., C6 s, F6 h | F6 e, E6 e, D6 e, C6 e, A5 q, D6 q | B5 h, G#5 h',
    },
    B: {
      chords: 'F | G | C | Am | F | G | E7 | E7',
      tune: 'A5 e, C6 e, F6 q, E6 q, C6 q | B5 e, D6 e, G6 q, F6 q, D6 q | E6 q, G6 q, C6 h | A5 h, E5 h | F5 q, A5 q, C6 q, F6 q | G6 e, F6 e, E6 e, D6 e, B5 h | G#5 q, B5 q, D6 q, E6 q | G#5 h, B5 h',
    },
  });
}
