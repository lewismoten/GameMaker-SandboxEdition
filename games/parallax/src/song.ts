// PARALLAX's one song, "Sliding By" in G major, played by its group's band (kit/starter/songStyle.ts: brass doubled
// below, a pumping bass, string stabs and a crash on every section): its first eight bars are section A, with a B
// section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 100,
    A: {
      chords: 'G | C | G | D | Am | D | C | G',
      tune: 'B4 q, D5 q, G5 q, D5 q | C5 q, E5 q, G5 h | B4 q, D5 q, G5 q, B5 q | A5 h, D5 h | C5 q, E5 q, A5 q, E5 q | D5 q, F5 q, A5 h | B4 q, D5 q, E5 q, G5 q | G5 w',
    },
    B: {
      chords: 'Em | C | G | D | Em | C | Am | D',
      tune: 'E5 q, G5 e., B5 s, E6 h | C6 q, E6 e., G6 s, E6 h | D6 q, B5 q, G5 q, D6 q | A5 h., F#5 q | G5 q, B5 e., E6 s, G6 h | E6 q, C6 q, G5 h | A5 q, C6 q, E6 q, C6 q | D6 h, A5 h',
    },
  });
}
