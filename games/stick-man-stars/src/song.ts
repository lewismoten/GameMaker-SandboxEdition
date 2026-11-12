// STICK MAN STARS' one song, "Hill at Night" in C major, played by the Starters' band
// (kit/starter/songStyle.ts: a square lead with its octave above, a bass in eighths and a busy beat):
// eight bars of A, eight of B, played AABB before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('moving', {
    bpm: 112,
    A: {
      chords: 'C | Am | F | G | C | Em | F | G',
      tune: 'E5 q, G5 q, C6 q, G5 q | A5 e, C6 e, E6 q, C6 q, A5 q | F5 q, A5 q, C6 q, A5 q | G5 e, B5 e, D6 q, B5 h | E5 q, G5 q, C6 q, E6 q | G5 e, E5 e, B5 q, G5 q, E5 q | A5 q, C6 q, F6 q, E6 q | D6 q, B5 q, G5 h',
    },
    B: {
      chords: 'F | C | Dm | G | F | C | G | C',
      tune: 'A5 e, C6 e, F6 q, E6 q, C6 q | G5 e, C6 e, E6 q, D6 q, C6 q | D6 q, F6 q, A6 q, F6 q | B5 e, D6 e, G6 q, F6 q, D6 q | C6 q, A5 q, F5 q, A5 q | G5 q, E5 q, C5 q, E5 q | D6 e, B5 e, G5 e, B5 e, D6 q, F6 q | E6 h, C6 h',
    },
  });
}
