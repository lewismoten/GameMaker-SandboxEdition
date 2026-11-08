// BIG BUG's one song, "Three Hits": a driving minor tune in A minor in its group's band (kit/starter/songStyle.ts: a
// lead doubled an octave down, a pumping bass, strings and a stomping beat), an A and a B section played AABA, 32
// bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('foes', {
    bpm: 136,
    A: {
      chords: 'Am | Am | F | E | Am | Am | Dm | E',
      tune: 'A5 q, A5 e, C6 e, B5 q, A5 q | E5 q, A5 q, B5 h | C6 q, C6 e, D6 e, C6 q, A5 q | G#5 h., E5 q | A5 q, A5 e, C6 e, E6 q, D6 q | C6 e, B5 e, A5 e, B5 e, C6 h | D6 q, F6 q, E6 q, D6 q | B5 h., r q',
    },
    B: {
      chords: 'F | G | C | Am | F | G | E | E',
      tune: 'A5 e, A5 e, C6 q, F6 q, E6 q | D6 e, D6 e, B5 q, G5 h | E6 q, C6 q, G5 q, C6 q | A5 h, E5 h | F5 e, A5 e, C6 e, F6 e, E6 q, C6 q | D6 e, B5 e, G5 e, B5 e, D6 h | E6 q, B5 q, G#5 q, E5 q | G#5 h, B5 h',
    },
  });
}
