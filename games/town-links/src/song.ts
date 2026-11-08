// OVERHEAD's one song, "Main Street": an outdoor calypso in A major in its group's band (kit/starter/songStyle.ts: a
// plucked lead, a pumping bass, three-three-two chords and toms), an A and a B section played AABB, 32 bars before it
// loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('bigger', {
    bpm: 122,
    A: {
      chords: 'A | D | E | A | F#m | D | E | A',
      tune: 'C#5 e, E5 q, A5 e, C#6 q, B5 q | A5 e, F#5 q, D5 e, F#5 h | E5 e, G#5 q, B5 e, E6 q, D6 q | C#6 h, A5 h | C#6 e, C#6 q, B5 e, A5 q, F#5 q | D6 e, D6 q, C#6 e, B5 q, A5 q | G#5 q., B5 q., E6 q | A5 h., r q',
    },
    B: {
      chords: 'D | A | D | E | D | A | B7 | E',
      tune: 'F#5 q., A5 q., D6 q | E6 q., C#6 q., A5 q | F#5 q., A5 q., F#6 q | E6 w | D6 e, F#6 q, D6 e, A5 q, F#5 q | E5 e, A5 q, C#6 e, E6 q, C#6 q | D#6 q, F#6 q, A5 q, D#6 q | E6 h, B5 h',
    },
  });
}
