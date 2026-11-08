// THROW IT's one song, "Toss and Catch" in D major, played by its group's band (kit/starter/songStyle.ts: a square
// lead with its octave above, a bass in eighths and a busy beat): its first eight bars are section A, with a B
// section added, played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('moving', {
    bpm: 132,
    A: {
      chords: 'D | G | D | A | Bm | G | A | D',
      tune: 'D5 e, F#5 e, A5 q, A5 e, F#5 e, D5 q | B4 e, D5 e, G5 q, G5 e, B5 e, A5 q | F#5 e, A5 e, D6 q, A5 e, F#5 e, A5 q | E5 e, A5 e, C#6 q, B5 e, A5 e, E5 q | F#5 e, B5 e, D6 q, D6 e, C#6 e, B5 q | B5 e, A5 e, G5 q, B5 e, D6 e, B5 q | C#6 e, B5 e, A5 q, E5 e, G5 e, A5 q | D5 e, F#5 e, A5 q, D6 h',
    },
    B: {
      chords: 'G | A | F#m | Bm | G | A | Em | A',
      tune: 'B5 q, G5 q, D6 e, B5 e, G5 q | C#6 q, A5 q, E6 e, C#6 e, A5 q | F#5 e, A5 e, C#6 e, F#6 e, E6 q, C#6 q | D6 h, B5 h | G5 e, B5 e, D6 e, G6 e, F#6 q, D6 q | E6 e, C#6 e, A5 e, C#6 e, E6 h | G6 q, E6 q, B5 q, G5 q | A5 h, C#6 h',
    },
  });
}
