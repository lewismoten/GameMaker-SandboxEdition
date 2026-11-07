// LIGHTS OUT's one song, "null" in D minor, played by its group's band (kit/starter/songStyle.ts: a bell and a
// celesta an octave apart over a held pad, no drums): its first eight bars are section A, with a B section added,
// played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('drawing', {
    bpm: 76,
    A: {
      chords: 'Dm | C | Bb | A | Dm | Gm | Bb | Dm',
      tune: 'D5 h, A4 q, F4 q | E5 h, C5 q, A4 q | D5 q, F5 q, E5 q, D5 q | A4 w | F5 h, D5 q, A4 q | G5 h, E5 q, C5 q | D5 q, C5 q, A4 q, F4 q | D4 w',
    },
    B: {
      chords: 'Bb | F | Gm | A | Bb | F | Gm | A',
      tune: 'F5 h, D5 q, Bb4 q | C5 h, A4 q, F4 q | G4 q, Bb4 q, D5 q, G5 q | E5 w | F5 q, Bb5 q, D6 h | C6 h, A5 h | Bb5 q, G5 q, E5 q, D5 q | C#5 w',
    },
  });
}
