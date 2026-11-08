// HEALTH AND HEARTS's one song, "Mend and Go" in F major, played by its group's band (kit/starter/songStyle.ts: a
// square lead with its octave above, a bass in eighths and a busy beat): its first eight bars are section A, with a B
// section added, played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('moving', {
    bpm: 120,
    A: {
      chords: 'F | C | F | Dm | Bb | C | Gm | F',
      tune: 'F5 q, A5 q, C6 q, A5 e, F5 e | G5 q, Bb5 q, D6 h | A5 q, C6 q, F6 q, E6 e, C6 e | D6 q, C6 q, A5 h | Bb5 q, D6 q, F6 q, D6 e, Bb5 e | A5 q, C6 q, E6 h | D6 q, C6 q, Bb5 q, A5 e, G5 e | F5 h, F5 h',
    },
    B: {
      chords: 'Dm | Bb | F | C | Dm | Bb | Gm | C',
      tune: 'D6 q, F6 e, D6 e, A5 q, D6 q | Bb5 q, D6 e, Bb5 e, F5 h | A5 e, C6 e, F6 e, C6 e, A5 q, F5 q | G5 e, A5 e, Bb5 e, C6 e, E6 h | F6 q, D6 e, A5 e, F5 q, A5 q | Bb5 q, D6 e, F6 e, D6 q, Bb5 q | G5 e, Bb5 e, D6 e, G6 e, F6 q, D6 q | E6 h, C6 h',
    },
  });
}
