// CORNER VIEW's one song, "Round the Corner" in A minor, played by its group's band (kit/starter/songStyle.ts: brass
// doubled below, a pumping bass, string stabs and a crash on every section): its first eight bars are section A, with
// a B section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 100,
    A: {
      chords: 'Am | Dm | G | C | Am | F | G | Am',
      tune: 'A4 q, C5 q, E5 q, C5 q | A4 q, D5 q, F5 q, D5 q | B4 q, D5 q, G5 q, D5 q | C5 q, E5 q, A5 h | A5 q, G5 q, E5 q, C5 q | F5 q, E5 q, D5 q, A4 q | G4 q, B4 q, D5 q, B4 q | A4 h, A4 h',
    },
    B: {
      chords: 'F | G | C | Am | F | G | E | E',
      tune: 'A5 q, C6 e., F6 s, C6 h | B5 q, D6 e., G6 s, D6 h | E6 q, C6 q, G5 q, C6 q | A5 h, E5 h | F5 q, A5 e., C6 s, F6 q, C6 q | D6 q, B5 e., G5 s, D5 h | E5 q, G#5 q, B5 q, D6 q | E6 h, B5 h',
    },
  });
}
