// NEAR AND FAR's one song, "Two Horizons": an outdoor calypso in G major in its group's band
// (kit/starter/songStyle.ts: a plucked lead, a pumping bass, three-three-two chords and toms), an A and a B section
// played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('bigger', {
    bpm: 120,
    A: {
      chords: 'G | C | D | G | Em | C | D | G',
      tune: 'D5 e, G5 q, G5 e, B5 q, D6 q | C6 e, E6 q, C6 e, G5 h | A5 e, F#5 q, D5 e, F#5 q, A5 q | G5 q, B5 q, D6 h | E6 e, D6 q, B5 e, G5 q, E5 q | C6 e, B5 q, A5 e, G5 h | F#5 q, A5 q, C6 q, F#5 q | G5 h., r q',
    },
    B: {
      chords: 'C | G | C | D | Bm | Em | Am D | G',
      tune: 'E6 h, G6 q, E6 q | D6 h, B5 q, G5 q | C6 q., E6 q., G6 q | F#6 w | D6 q., F#6 q., B5 q | G5 q., B5 q., E6 q | C6 q, A5 q, D6 q, F#5 q | G5 w',
    },
  });
}
