// THE SHOW's one song, "Curtain Call" in C major, played by its group's band (kit/starter/songStyle.ts: brass doubled
// below, a pumping bass, string stabs and a crash on every section): its first eight bars are section A, with a B
// section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 104,
    A: {
      chords: 'C | Dm | C | G | C | F | C | C',
      tune: 'C5 e, E5 e, G5 q, E5 e, C5 e, D5 q | D5 e, F5 e, A5 q, F5 e, D5 e, E5 q | E5 e, G5 e, C6 q, G5 e, E5 e, F5 q | D5 e, E5 e, D5 q, G4 h | C5 e, E5 e, G5 q, E5 e, C5 e, D5 q | F5 e, A5 e, C6 q, A5 e, F5 e, G5 q | E5 e, D5 e, C5 q, B4 e, D5 e, G4 q | C5 e, E5 e, G5 q, C5 h',
    },
    B: {
      chords: 'F | G | Em | Am | F | G | Dm | G',
      tune: 'A5 q, C6 e., F6 s, A6 h | G6 q, D6 e., B5 s, G5 h | E5 q, G5 e., B5 s, E6 q, B5 q | C6 h., A5 q | F5 q, A5 e., C6 s, F6 q, C6 q | D6 q, B5 e., G5 s, D6 h | F6 q, D6 q, A5 q, F5 q | G5 h, B4 h',
    },
  });
}
