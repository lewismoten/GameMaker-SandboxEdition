// MANY WEAPONS's one song, "Pouch Full" in G major, played by its group's band (kit/starter/songStyle.ts: a square
// lead with its octave above, a bass in eighths and a busy beat): its first eight bars are section A, with a B
// section added, played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('moving', {
    bpm: 132,
    A: {
      chords: 'G | Am | G | D | G | Am | D | G',
      tune: 'G5 q, B5 e, D6 e, B5 q, G5 q | A5 q, C6 e, E6 e, C6 q, A5 q | B5 q, D6 e, G6 e, D6 q, B5 q | A5 e, B5 e, C6 q, D6 h | G5 q, B5 e, D6 e, G6 q, D6 q | E6 q, C6 e, A5 e, C6 h | B5 q, A5 e, G5 e, F#5 q, A5 q | G5 q, D5 q, G5 h',
    },
    B: {
      chords: 'C | D | Em | Bm | C | Am | C | D',
      tune: 'E6 e, D6 e, C6 q, G5 q, E5 q | F#5 e, G5 e, A5 q, D6 h | B5 e, C6 e, B5 q, G5 q, E5 q | F#5 e, G5 e, F#5 q, D5 h | E5 e, G5 e, C6 e, E6 e, G6 q, E6 q | C6 e, A5 e, E5 e, A5 e, C6 h | E6 q, C6 q, G5 q, E5 q | F#5 h, A5 h',
    },
  });
}
