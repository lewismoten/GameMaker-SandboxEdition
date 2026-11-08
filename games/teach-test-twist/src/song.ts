// TEACH, TEST, TWIST's one song, "First Steps Forward" in F major, played by its group's band
// (kit/starter/songStyle.ts: piano with a bell above, a walking bass, a pluck on every off-beat and a ticking hat):
// its first eight bars are section A, with a B section added, played AABA, 32 bars before it loops. It plays on the
// title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 132,
    A: {
      chords: 'F | Gm | F | C | F | Gm | Dm | F',
      tune: 'F5 q, A5 e, C6 e, A5 q, F5 q | G5 q, Bb5 e, D6 e, Bb5 q, G5 q | A5 q, C6 e, E6 e, C6 q, A5 q | G5 e, A5 e, Bb5 e, G5 e, F5 h | C6 q, A5 e, F5 e, A5 q, C6 q | D6 q, Bb5 e, G5 e, Bb5 q, D6 q | C6 e, Bb5 e, A5 e, G5 e, A5 q, F5 q | G5 q, E5 q, F5 h',
    },
    B: {
      chords: 'Bb | C | Am | Dm | Bb | C | Gm | C',
      tune: 'D6 q, F6 e, D6 e, Bb5 q, F5 q | E5 q, G5 e, C6 e, E6 q, C6 q | A5 e, C6 e, E6 e, C6 e, A5 q, E5 q | F5 h, A5 h | Bb5 q, D6 e, F6 e, D6 q, Bb5 q | C6 q, E6 e, G6 e, E6 q, C6 q | Bb5 e, A5 e, G5 e, Bb5 e, D6 q, G5 q | C6 h, E5 h',
    },
  });
}
