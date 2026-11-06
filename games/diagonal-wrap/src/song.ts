// DIAGONAL WRAP's one song, "Round and Round" in C major, played by its group's band (kit/starter/songStyle.ts: a
// plucked oud, a pumping bass, three-three-two chords and toms): its first eight bars are section A, with a B section
// added, played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('bigger', {
    bpm: 120,
    A: {
      chords: 'C | G | Dm | F | Em | G | Dm | C',
      tune: 'E5 q, G5 q, C6 q, G5 q | G5 q, B5 q, D6 h | F5 q, A5 q, D6 q, A5 q | A5 q, C6 q, F5 h | G5 q, B5 q, E6 q, B5 q | B5 q, D6 q, G5 h | A5 q, F5 q, D5 q, F5 q | E5 q, G5 q, C5 h',
    },
    B: {
      chords: 'Am | Em | F | C | Dm | G | Em | G',
      tune: 'C6 q., A5 q., E5 q | G5 q., B5 q., E6 q | F6 e, C6 q, A5 e, F5 q, A5 q | G5 h, E5 h | F5 q., A5 q., D6 q | B5 q., G5 q., D5 q | E5 e, G5 q, B5 e, E6 q, B5 q | D6 h, B5 h',
    },
  });
}
