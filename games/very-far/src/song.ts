// WALKING VERY FAR's one song, "Farther Still": an outdoor calypso in D mixolydian in its group's band
// (kit/starter/songStyle.ts: a plucked lead, a pumping bass, three-three-two chords and toms), an A and a B section
// played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('bigger', {
    bpm: 116,
    A: {
      chords: 'D | C | G | D | D | C | G | A',
      tune: 'A5 q, F#5 e, A5 q, D6 e, A5 q | G5 q, E5 e, G5 q, C6 e, G5 q | B5 e, A5 e, G5 e, B5 e, D6 h | A5 h, F#5 h | A5 q, F#5 e, A5 q, D6 e, F#6 q | E6 q, C6 e, G5 q, E5 e, C6 q | D6 e, B5 e, G5 e, B5 e, A5 q, G5 q | E5 h., r q',
    },
    B: {
      chords: 'G | D | G | A | Bm | G | C | A',
      tune: 'B5 q., D6 q., G6 q | F#6 q., D6 q., A5 q | B5 e, C#6 e, D6 e, E6 e, G6 q, D6 q | E6 w | F#6 q., D6 q., B5 q | G5 q., B5 q., D6 q | E6 q, G6 q, C6 q, E6 q | C#6 h, A5 h',
    },
  });
}
