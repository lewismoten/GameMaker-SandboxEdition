// FLICKER AND FLOW's one song, "null" in A minor, played by its group's band (kit/starter/songStyle.ts: a bell and a
// celesta an octave apart over a held pad, no drums): its first eight bars are section A, with a B section added,
// played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('drawing', {
    bpm: 104,
    A: {
      chords: 'Am | F | C | E | Am | Dm | C | Am',
      tune: 'A4 q, C5 e, B4 e, A4 q, E4 q | F4 q, A4 e, G4 e, F4 h | E4 q, G4 e, A4 e, C5 q, B4 q | A4 h, E4 h | A4 q, C5 e, E5 e, D5 q, C5 q | D5 q, F5 e, E5 e, D5 h | C5 q, B4 e, A4 e, G4 q, E4 q | A4 w',
    },
    B: {
      chords: 'F | G | Em | Am | Dm | G | E | E',
      tune: 'C5 h, A4 h | D5 h, B4 h | E5 q, G5 q, B5 h | A5 w | F5 q, A5 q, D5 h | G5 q, B5 q, D6 h | B5 q, G#5 q, E5 q, B4 q | E5 w',
    },
  });
}
