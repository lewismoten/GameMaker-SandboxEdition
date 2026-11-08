// WAVES ON THE SHORE's one song, "Low Tide" in C major, played by its group's band (kit/starter/songStyle.ts: a bell
// and a celesta an octave apart over a held pad, no drums): its first eight bars are section A, with a B section
// added, played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('drawing', {
    bpm: 120,
    A: {
      chords: 'C | G | Am | F | C | G | F | C',
      tune: 'E5 q, G5 q, A5 q, G5 q | D5 q, G5 q, B5 q, G5 q | C5 q, E5 q, A5 q, E5 q | A5 q, F5 q, C5 h | E5 q, G5 q, C6 q, G5 q | B5 q, G5 q, D5 q, G5 q | A5 q, F5 q, A5 q, C6 q | G5 q, E5 q, C5 h',
    },
    B: {
      chords: 'Am | Em | F | C | Dm | Am | F | G',
      tune: 'A5 h, E5 h | G5 h, B5 h | C6 q, A5 q, F5 h | E5 w | D5 q, F5 q, A5 h | C6 h, E6 h | D6 q, C6 q, A5 q, F5 q | G5 w',
    },
  });
}
