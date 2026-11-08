// OVERHEAD's one song, "Bird's Eye": an outdoor calypso in C major in its group's band (kit/starter/songStyle.ts: a
// plucked lead, a pumping bass, three-three-two chords and toms), an A and a B section played AABB, 32 bars before it
// loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('bigger', {
    bpm: 118,
    A: {
      chords: 'C | F | G | C | C | F | G | C',
      tune: 'E5 q., G5 q., C6 q | A5 q., F5 q., C5 q | D5 e, G5 e, B5 q, D6 q, B5 q | C6 h, r h | E5 q., G5 q., E6 q | D6 q., C6 q., A5 q | B5 e, A5 e, G5 e, F5 e, D5 q, G5 q | C5 h., r q',
    },
    B: {
      chords: 'F | C | G | C | F | C | G | G7',
      tune: 'A5 e, C6 q, A5 e, F5 q, C6 q | G5 e, E6 q, C6 e, G5 h | B5 e, D6 q, B5 e, G5 q, D6 q | E6 h, C6 h | F6 e, F6 q, E6 e, D6 q, C6 q | E6 e, D6 q, C6 e, G5 h | B5 q., D6 q., G6 q | F6 h, D6 h',
    },
  });
}
