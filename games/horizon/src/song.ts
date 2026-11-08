// TO THE HORIZON's one song, "Sky Line": a showtime tune in G major in its group's band (kit/starter/songStyle.ts:
// brass doubled below, a pumping bass, string stabs and a crash on every section), an A and a B section played AABA,
// 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 126,
    A: {
      chords: 'G | D | Em | C | G | D | C D | G',
      tune: 'G4 q., D5 e, G5 h | F#5 q., A5 e, D6 h | B5 q, G5 q, E5 q, B5 q | C6 h., r q | D6 q., B5 e, G5 h | A5 q., F#5 e, D5 h | E5 q, G5 q, F#5 q, A5 q | G5 h., r q',
    },
    B: {
      chords: 'C | G | Am | D | C | G | A7 | D',
      tune: 'E5 q, G5 q, C6 q, E6 q | D6 h, B5 h | C6 e, B5 e, A5 e, B5 e, C6 q, E6 q | D6 w | E6 q, C6 q, G5 q, C6 q | B5 q, D6 q, G6 h | E6 q, C#6 q, A5 q, G5 q | F#5 h., r q',
    },
  });
}
