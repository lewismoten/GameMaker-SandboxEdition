// SCROLL OR STAY's one song, "Pan" in C major, played by its group's band (kit/starter/songStyle.ts: a plucked oud, a
// pumping bass, three-three-two chords and toms): its first eight bars are section A, with a B section added, played
// AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('bigger', {
    bpm: 104,
    A: {
      chords: 'C | C | Am | F | C | Am | F | G',
      tune: 'E5 q, G5 e, E5 e, C5 q, D5 q | E5 q, D5 e, C5 e, G4 h | A4 q, C5 e, E5 e, A5 q, G5 q | F5 q, E5 e, D5 e, E5 h | E5 q, G5 e, E5 e, C6 q, G5 q | A5 q, G5 e, E5 e, D5 h | F5 q, A5 e, F5 e, D5 q, B4 q | C5 q, E5 q, C5 h',
    },
    B: {
      chords: 'F | G | Em | Am | F | G | Dm | G',
      tune: 'A5 q., C6 q., F6 q | D6 q., B5 q., G5 q | E5 e, G5 q, B5 e, E6 q, B5 q | C6 h, A5 h | F5 q., A5 q., C6 q | B5 q., D6 q., G6 q | F6 e, D6 q, A5 e, F5 q, D5 q | G5 h., r q',
    },
  });
}
