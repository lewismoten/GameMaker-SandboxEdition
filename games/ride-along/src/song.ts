// RIDE ALONG's one song, "Rising" in A minor, played by its group's band (kit/starter/songStyle.ts: brass doubled
// below, a pumping bass, string stabs and a crash on every section): its first eight bars are section A, with a B
// section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 124,
    A: {
      chords: 'Am | F | C | G | Am | F | C | G',
      tune: 'A4 q, C5 q, E5 q, A5 q | A4 q, C5 q, F5 q, A5 q | G4 q, C5 q, E5 q, G5 q | B4 q, D5 q, G5 h | C5 e, E5 e, A5 q, G5 e, E5 e, C5 q | C5 e, F5 e, A5 q, C6 q, A5 q | E5 e, G5 e, C6 q, B5 q, G5 q | D6 q, B5 q, G5 q, D5 q',
    },
    B: {
      chords: 'Dm | Am | Dm | E | F | C | Dm | E',
      tune: 'D5 q, F5 q, A5 q, D6 q | C6 q, A5 q, E5 h | F5 e, A5 e, D6 q, F6 q, D6 q | E6 h, B5 h | F5 e, A5 e, C6 q, F6 q, C6 q | E6 e, C6 e, G5 q, E5 q, G5 q | F5 q, A5 q, D6 q, F6 q | E6 h, G#5 h',
    },
  });
}
