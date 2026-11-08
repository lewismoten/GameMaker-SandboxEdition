// SCORE POPUPS's one song, "Ta-Da": a showtime tune in E-flat major in its group's band (kit/starter/songStyle.ts:
// brass doubled below, a pumping bass, string stabs and a crash on every section), an A and a B section played AABA,
// 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 132,
    A: {
      chords: 'Eb | Ab | Bb | Eb | Cm | Ab | F7 | Bb',
      tune: 'Bb4 q, Eb5 e., G5 s, Bb5 h | C6 q, Ab5 e., F5 s, Eb5 h | D5 q, F5 e., Bb5 s, D6 q, Bb5 q | G5 h., r q | C6 q, Eb6 e., C6 s, G5 h | Ab5 q, C6 e., Eb6 s, Ab6 h | A5 q, C6 q, Eb6 q, C6 q | D6 h., r q',
    },
    B: {
      chords: 'Ab | Eb | Ab | Bb | Gm | Cm | F7 Bb | Eb',
      tune: 'C6 e, C6 e, Eb6 q, Ab6 h | G6 e, F6 e, Eb6 q, Bb5 h | C6 e, Eb6 e, Ab6 q, G6 q, F6 q | D6 w | G6 q, F6 q, D6 q, Bb5 q | Eb6 q, D6 q, C6 h | A5 q, C6 q, D6 q, F6 q | Eb6 h., r q',
    },
  });
}
