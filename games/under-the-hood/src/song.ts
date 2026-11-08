// UNDER THE HOOD's one song, "Bytes in a Row" in C major, played by its group's band (kit/starter/songStyle.ts: brass
// doubled below, a pumping bass, string stabs and a crash on every section): its first eight bars are section A, with
// a B section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 132,
    A: {
      chords: 'C | F | G | C | C | F | G | C',
      tune: 'C5 e, E5 e, G5 e, E5 e, C5 q, G4 q | A4 e, C5 e, F5 e, C5 e, A4 q, F4 q | G4 e, B4 e, D5 e, G5 e, F5 q, D5 q | E5 q, C5 q, G4 h | C5 e, D5 e, E5 e, G5 e, A5 q, G5 q | F5 e, E5 e, D5 e, C5 e, A4 q, C5 q | D5 q, G5 q, F5 q, D5 q | C5 q, G4 q, C5 h',
    },
    B: {
      chords: 'Am | F | G | C | Am | Dm | F | G',
      tune: 'A5 e, C6 e, E6 e, C6 e, A5 q, E5 q | F5 e, A5 e, C6 e, A5 e, F5 q, C5 q | G5 e, B5 e, D6 e, B5 e, G5 q, D5 q | E5 q, G5 q, C6 h | A5 e, B5 e, C6 e, E6 e, A6 q, E6 q | D6 e, C6 e, A5 e, F5 e, D5 q, F5 q | A5 q, C6 q, F6 q, A5 q | G5 h, B4 h',
    },
  });
}
