// STRONGER KEYS's one song, "Up the Ladder" in C major, played by its group's band (kit/starter/songStyle.ts:
// electric piano over a walking bass, a held organ and a ride cymbal): its first eight bars are section A, with a B
// section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 120,
    A: {
      chords: 'C | C | G | C | C | F | G | C',
      tune: 'C5 q, C5 e, D5 e, E5 q, E5 q | E5 q, E5 e, F5 e, G5 q, G5 q | G5 q, G5 e, A5 e, B5 q, B5 q | C6 h, G5 h | C6 q, B5 e, A5 e, G5 q, E5 q | F5 q, E5 e, D5 e, C5 q, E5 q | D5 q, F5 q, G5 q, B4 q | C5 h, C5 h',
    },
    B: {
      chords: 'Am | F | G | C | Am | Dm | F | G',
      tune: 'A5 q, A5 e, B5 e, C6 q, C6 q | C6 q, C6 e, D6 e, E6 q, E6 q | D6 q, B5 e, G5 e, D6 q, F6 q | E6 h, C6 h | A5 q, C6 e, E6 e, A6 q, E6 q | F6 q, D6 e, A5 e, F5 q, A5 q | C6 q, A5 q, F5 q, A5 q | B5 h, G5 h',
    },
  });
}
