// ROAD TILES's one song, "Open Road" in C major, played by its group's band (kit/starter/songStyle.ts: a bell and a
// celesta an octave apart over a held pad, no drums): its first eight bars are section A, with a B section added,
// played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('drawing', {
    bpm: 120,
    A: {
      chords: 'C | G | Dm | F | Em | G | Dm | C',
      tune: 'G5 q, E5 e, G5 e, C6 q, G5 q | D6 q, B5 q, G5 q, B5 q | A5 q, F5 e, A5 e, D6 q, A5 q | C6 q, A5 q, F5 q, A5 q | B5 q, G5 e, B5 e, E6 q, B5 q | D6 q, G5 q, B5 q, D6 q | F6 q, D6 e, C6 e, A5 q, F5 q | E5 q, G5 q, C6 h',
    },
    B: {
      chords: 'F | C | Dm | G | Am | Em | F | G',
      tune: 'A5 h, C6 q, F6 q | E6 h, G5 h | F5 q, A5 q, D6 h | B5 w | C6 q, E6 q, A6 h | G6 q, E6 q, B5 h | A5 q, C6 q, F6 q, C6 q | D6 h, B5 h',
    },
  });
}
