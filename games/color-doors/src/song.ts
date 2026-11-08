// BOTH TOGETHER's one song, "Stained Glass": a slow, painted-sky tune in C major in its group's band
// (kit/starter/songStyle.ts: a bell and a celesta an octave apart over a held pad, no drums), an A and a B section
// played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('drawing', {
    bpm: 84,
    A: {
      chords: 'C | Am | F | G | C | Am | F | G',
      tune: 'E5 h, G5 q, A5 q | C6 h, A5 h | G5 q, E5 q, D5 q, C5 q | D5 w | E5 h, G5 q, C6 q | D6 h, E6 q, C6 q | A5 q, G5 q, E5 q, D5 q | G5 w',
    },
    B: {
      chords: 'F | C | Dm | Am | F | C | G | G',
      tune: 'A5 q., C6 e, D6 h | E6 h, G6 h | F6 q, D6 q, A5 h | C6 h, E6 h | A5 q., G5 e, A5 q, C6 q | G5 h, E5 h | D5 q, E5 q, G5 q, A5 q | G5 h, D5 h',
    },
  });
}
