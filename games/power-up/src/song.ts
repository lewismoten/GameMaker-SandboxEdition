// POWER UP's one song, "Boing" in C major, played by its group's band (kit/starter/songStyle.ts: a square lead with
// its octave above, a bass in eighths and a busy beat): its first eight bars are section A, with a B section added,
// played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('moving', {
    bpm: 132,
    A: {
      chords: 'C | G | F | C | C | G | F | G',
      tune: 'C5 e, E5 e, G5 q, E5 e, G5 e, C6 q | B5 e, G5 e, D5 q, G5 h | A5 e, F5 e, C5 q, F5 e, A5 e, C6 q | B5 q, G5 q, E5 h | C5 e, E5 e, G5 e, C6 e, E6 q, C6 q | D6 e, B5 e, G5 q, D6 h | C6 e, A5 e, F5 e, A5 e, G5 q, E5 q | D5 q, G5 q, C5 h',
    },
    B: {
      chords: 'Am | F | C | G | Am | F | D | G',
      tune: 'A5 e, C6 e, E6 q, C6 e, A5 e, E5 q | F5 e, A5 e, C6 q, F6 e, C6 e, A5 q | G5 e, C6 e, E6 q, G6 e, E6 e, C6 q | D6 e, B5 e, G5 q, B5 h | A5 e, E5 e, A5 e, C6 e, E6 q, A6 q | F6 e, E6 e, D6 e, C6 e, A5 h | F#5 e, A5 e, D6 e, F#6 e, A6 q, F#6 q | G6 h, D6 h',
    },
  });
}
