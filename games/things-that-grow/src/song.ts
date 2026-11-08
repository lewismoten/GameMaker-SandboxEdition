// SEEDS AND NESTS's one song, "Sprout Song": a sunny little march in G major in its group's band
// (kit/starter/songStyle.ts: piano over an oom-pah pluck and a light kick) (here with a bell lead), an A and a B
// section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 120,
    lead: 'bell',
    A: {
      chords: 'G | C | G | D | Em | C | D | G',
      tune: 'D5 q, G5 q, G5 e, A5 e, B5 q | C6 h, B5 q, A5 q | B5 q, G5 q, D5 q, G5 q | A5 h., r q | B5 q, B5 e, C6 e, D6 q, B5 q | C6 q, A5 q, E5 q, A5 q | D6 q, C6 q, B5 q, A5 q | G5 h., r q',
    },
    B: {
      chords: 'C | G | Am | D | C | G | Am D | G',
      tune: 'E6 q., D6 e, C6 q, G5 q | D6 q., C6 e, B5 h | A5 e, B5 e, C6 e, D6 e, E6 q, C6 q | D6 w | E6 q, G6 q, E6 q, C6 q | D6 q, B5 q, G5 h | A5 q, C6 q, B5 q, A5 q | G5 w',
    },
  });
}
