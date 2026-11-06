// SMASH IT's one song, "Thump" in G major, played by its group's band (kit/starter/songStyle.ts: piano over an
// oom-pah pluck and a light kick): its first eight bars are section A, with a B section added, played AABA, 32 bars
// before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 120,
    A: {
      chords: 'G | C | D | G | G | C | D | G',
      tune: 'G4 e, B4 e, D5 q, G5 e, D5 e, B4 q | C5 e, E5 e, G5 q, E5 h | D5 e, F5 e, A5 q, F5 e, D5 e, A4 q | B4 q, D5 q, G5 h | G4 e, B4 e, D5 q, G5 e, D5 e, B4 q | C5 e, E5 e, G5 q, C6 h | A5 e, F5 e, D5 e, F5 e, A5 q, D5 q | G5 q, D5 q, G4 h',
    },
    B: {
      chords: 'Em | C | Am | D | Em | C | A7 | D',
      tune: 'B5 q, E6 q, B5 q, G5 q | C6 q, E6 q, C6 q, G5 q | A5 e, B5 e, C6 e, E6 e, A6 q, E6 q | F#6 h, D6 h | G6 q, E6 q, B5 q, E6 q | C6 q, G5 q, E5 q, G5 q | C#6 q, E6 q, A5 q, C#6 q | D6 h, A5 h',
    },
  });
}
