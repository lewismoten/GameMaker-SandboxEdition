// SLIPPERY AND BOUNCY's one song, "Slide and Bounce" in C major, played by its group's band
// (kit/starter/songStyle.ts: a flute with a bell an octave up over a held pad and a slow pulse): its first eight bars
// are section A, with a B section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the
// levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('worlds', {
    bpm: 120,
    A: {
      chords: 'C | G | Am | F | C | G | F | C',
      tune: 'E5 e, G5 e, C6 q, G5 e, E5 e, G5 q | D5 e, G5 e, B5 q, G5 e, D5 e, B5 q | C5 e, E5 e, A5 q, E5 e, C5 e, A5 q | A5 e, C6 e, F6 q, E6 e, C6 e, A5 q | G5 e, C6 e, E6 q, C6 e, G5 e, E6 q | G5 e, B5 e, D6 q, B5 e, G5 e, D6 q | A5 q, C6 q, E6 q, D6 e, C6 e | C6 h, C6 h',
    },
    B: {
      chords: 'F | G | Em | Am | F | G | Dm | G',
      tune: 'A5 h, C6 q, F6 q | D6 h, B5 h | G5 q, B5 q, E6 q, B5 q | C6 w | A5 q., C6 e, F6 h | D6 q., B5 e, G5 h | F5 q, A5 q, D6 q, F6 q | D6 h, B5 h',
    },
  });
}
