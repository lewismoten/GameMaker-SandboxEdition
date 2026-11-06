// LOOKS LIKE A WALL's one song, "Tiptoe" in A minor, played by its group's band (kit/starter/songStyle.ts: electric
// piano over a walking bass, a held organ and a ride cymbal): its first eight bars are section A, with a B section
// added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 120,
    A: {
      chords: 'Am | F | G | Am | Am | F | G | Am',
      tune: 'A4 e, C5 e, E5 q, A5 e, E5 e, C5 q | F4 e, A4 e, C5 q, F5 h | G4 e, B4 e, D5 q, G5 e, D5 e, B4 q | E5 q, C5 q, A4 h | A4 e, C5 e, E5 q, A5 e, E5 e, C5 q | F5 e, A5 e, C6 q, A5 h | G5 e, E5 e, D5 e, B4 e, G4 q, B4 q | A4 q, E4 q, A4 h',
    },
    B: {
      chords: 'Dm | Am | Dm | E | F | C | Dm | E',
      tune: 'D5 e, F5 e, A5 q, D6 e, A5 e, F5 q | E5 e, A5 e, C6 q, E6 h | F6 e, E6 e, D6 q, A5 e, F5 e, D5 q | E5 q, G#5 q, B5 h | A5 e, C6 e, F6 q, C6 e, A5 e, F5 q | G5 e, C6 e, E6 q, C6 h | D6 q, F6 q, A5 q, D6 q | B5 h, G#5 h',
    },
  });
}
