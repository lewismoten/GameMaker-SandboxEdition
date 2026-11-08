// ROOM TO ROOM's one song, "Next Door" in C major, played by its group's band (kit/starter/songStyle.ts: piano over
// an oom-pah pluck and a light kick): its first eight bars are section A, with a B section added, played AABA, 32
// bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 120,
    A: {
      chords: 'C | C | C | Am | F | G | C | G',
      tune: 'E5 q, G5 e, E5 e, C5 q, D5 q | E5 e, F5 e, G5 q, A5 h | G5 q, E5 e, G5 e, C6 q, B5 q | A5 q, G5 q, E5 h | F5 q, A5 e, F5 e, D5 q, E5 q | F5 e, G5 e, A5 q, B5 h | C6 q, B5 e, A5 e, G5 q, E5 q | D5 q, E5 q, C5 h',
    },
    B: {
      chords: 'Am | Em | F | C | Dm | G | F | G',
      tune: 'A5 q, C6 q, E6 q, C6 q | B5 q, G5 q, E5 h | F5 e, G5 e, A5 e, C6 e, F6 q, C6 q | E6 h, C6 h | D6 q, A5 q, F5 q, A5 q | B5 q, D6 q, G5 h | A5 q, C6 q, F6 q, A5 q | G5 h., r q',
    },
  });
}
