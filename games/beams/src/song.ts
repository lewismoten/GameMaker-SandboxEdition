// BEAMS AND FOG's one song, "Long Afternoon" in C major, played by its group's band (kit/starter/songStyle.ts: a bell
// and a celesta an octave apart over a held pad, no drums): its first eight bars are section A, with a B section
// added, played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('drawing', {
    bpm: 88,
    A: {
      chords: 'C | G | Am | C | Am | F | G | C',
      tune: 'E5 h, G5 q, E5 q | D5 h, C5 h | E5 q, G5 q, A5 h | G5 w | A5 h, G5 q, E5 q | F5 h, E5 h | D5 q, E5 q, F5 q, D5 q | C5 w',
    },
    B: {
      chords: 'F | C | Dm | G | F | Em | Dm | G',
      tune: 'A5 h, C6 h | G5 h, E5 h | F5 q, A5 q, D6 h | B5 w | C6 h, A5 q, F5 q | G5 h, B5 h | A5 q, F5 q, D5 q, F5 q | G5 w',
    },
  });
}
