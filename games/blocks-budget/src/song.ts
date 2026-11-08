// ROOMS ON ONE MAP's one song, "Penny Wise": an outdoor calypso in F major in its group's band
// (kit/starter/songStyle.ts: a plucked lead, a pumping bass, three-three-two chords and toms) (here with a reed
// lead), an A and a B section played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and
// the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('bigger', {
    bpm: 114,
    lead: 'reed',
    A: {
      chords: 'F | F | C | C | Bb | F | C | F',
      tune: 'C5 e, F5 q, A5 e, C6 q, A5 q | F5 q., G5 q., A5 q | G5 e, C6 q, G5 e, E5 q, C5 q | G5 q., A5 q., Bb5 q | D6 e, Bb5 q, F5 e, D5 q, F5 q | A5 q., G5 q., F5 q | E5 e, G5 e, C6 q, Bb5 q, G5 q | F5 h., r q',
    },
    B: {
      chords: 'Bb | C | Am | Dm | Bb | C | F | C',
      tune: 'D6 q., C6 q., Bb5 q | E6 q., D6 q., C6 q | C6 e, A5 q, E5 e, A5 q, C6 q | D6 h, A5 h | Bb5 e, D6 q, F6 e, D6 q, Bb5 q | C6 e, E6 q, G6 e, E6 q, C6 q | A5 q., C6 q., F6 q | E6 h, C6 h',
    },
  });
}
