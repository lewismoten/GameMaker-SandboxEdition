// FIRST STEPS's one song, "Little Steps" in C major, played by its group's band (kit/starter/songStyle.ts: piano over
// an oom-pah pluck and a light kick): its first eight bars are section A, with a B section added, played AABA, 32
// bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 132,
    A: {
      chords: 'C | F | C | G | C | F | G | C',
      tune: 'C5 q, E5 q, G5 q, E5 q | F5 q, A5 q, G5 h | E5 q, G5 q, C6 q, G5 q | F5 q, D5 q, C5 h | C5 e, D5 e, E5 e, F5 e, G5 q, G5 q | A5 q, F5 q, G5 h | E5 q, C6 q, B5 q, G5 q | A5 q, D5 q, C5 h',
    },
    B: {
      chords: 'F | C | F | G | Am | F | D7 | G',
      tune: 'A5 q, C6 q, A5 q, F5 q | G5 q, E5 q, C5 h | A5 e, B5 e, C6 e, D6 e, C6 q, A5 q | G5 h., r q | A5 q, C6 q, E6 q, C6 q | A5 q, F5 q, C5 h | F#5 q, A5 q, C6 q, A5 q | G5 h, B4 h',
    },
  });
}
