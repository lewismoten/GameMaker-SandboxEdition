// LITTLE SHADOWS's one song, "Lengthening": a slow, painted-sky tune in A minor in its group's band
// (kit/starter/songStyle.ts: a bell and a celesta an octave apart over a held pad, no drums), an A and a B section
// played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('drawing', {
    bpm: 78,
    A: {
      chords: 'Am | Em | F | C | Am | Em | G | E',
      tune: 'A5 h., C6 q | B5 h, G5 h | A5 q, C6 q, F6 h | E6 w | D6 h., C6 q | B5 h, E5 h | G5 q, A5 q, B5 q, D6 q | B5 h, G#5 h',
    },
    B: {
      chords: 'F | G | Am | Am | F | G | E | E',
      tune: 'C6 q, A5 q, F5 h | D6 q, B5 q, G5 h | E6 h., D6 q | C6 w | A5 q, C6 q, F6 q, E6 q | D6 h, B5 h | G#5 q, B5 q, E6 h | E5 w',
    },
  });
}
