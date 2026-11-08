// ROOMS ON ONE MAP's one song, "Map Room" in G major, played by its group's band (kit/starter/songStyle.ts: a plucked
// oud, a pumping bass, three-three-two chords and toms): its first eight bars are section A, with a B section added,
// played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('bigger', {
    bpm: 116,
    A: {
      chords: 'G | C | Am | D | G | C | D | G',
      tune: 'G4 q, B4 e, D5 e, G5 q, D5 q | E5 q, C5 e, E5 e, G5 h | A4 q, C5 e, E5 e, A5 q, E5 q | F#5 q, D5 e, A4 e, D5 h | G4 q, B4 e, D5 e, B5 q, G5 q | E5 q, G5 e, C6 e, B5 h | A5 q, F#5 e, D5 e, E5 q, F#5 q | G5 q, D5 e, B4 e, G4 h',
    },
    B: {
      chords: 'C | D | Bm | Em | C | D | Am | D',
      tune: 'E5 q., G5 q., C6 q | D6 q., A5 q., F#5 q | D5 e, F#5 q, B5 e, D6 q, B5 q | G5 h, E5 h | C6 e, E6 q, C6 e, G5 q, E5 q | F#5 e, A5 q, D6 e, F#6 q, D6 q | C6 q., A5 q., E5 q | F#5 h, A5 h',
    },
  });
}
