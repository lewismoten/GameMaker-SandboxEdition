// EVERYBODY TALKS's one song, "Chatter" in G major, played by its group's band (kit/starter/songStyle.ts: brass
// doubled below, a pumping bass, string stabs and a crash on every section): its first eight bars are section A, with
// a B section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 120,
    A: {
      chords: 'G | Em | C | D | G | C | C | G',
      tune: 'G5 e, A5 e, B5 q, D6 q, B5 q | A5 e, G5 e, E5 q, G5 h | C6 e, B5 e, A5 q, E5 q, G5 q | F#5 e, G5 e, A5 q, D5 h | B5 e, B5 e, D6 q, B5 q, G5 q | A5 q, C6 q, B5 h | E5 q, G5 q, A5 q, C6 q | B5 q, A5 q, G5 h',
    },
    B: {
      chords: 'C | D | Bm | Em | Am | D | Am | D',
      tune: 'E6 q, C6 e., G5 s, E5 h | F#5 q, A5 e., D6 s, F#6 h | D6 q, B5 q, F#5 q, B5 q | G5 h., E5 q | A5 q, C6 e., E6 s, A6 h | F#6 q, D6 q, A5 h | C6 q, E6 q, A5 q, C6 q | D6 h, F#5 h',
    },
  });
}
