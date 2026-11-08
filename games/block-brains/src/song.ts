// ROLL THE DICE's one song, "Thinking Cap": a clockwork tune in C major in its group's band
// (kit/starter/songStyle.ts: piano with a bell above, a walking bass, a pluck on every off-beat and a ticking hat),
// an A and a B section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 120,
    A: {
      chords: 'C | F | G | C | Am | F | D7 | G',
      tune: 'C5 e, E5 e, G5 e, E5 e, C6 q, G5 q | A5 e, F5 e, C5 e, F5 e, A5 h | B5 e, G5 e, D5 e, G5 e, B5 q, D6 q | C6 h, G5 h | A5 e, C6 e, E6 e, C6 e, A5 q, E5 q | F5 e, A5 e, C6 e, A5 e, F5 h | F#5 q, A5 q, C6 q, D6 q | B5 h., r q',
    },
    B: {
      chords: 'F | C | F | C | Dm | G | Dm G | C',
      tune: 'A5 q, A5 e, G5 e, F5 q, C6 q | G5 h, E5 h | A5 e, B5 e, C6 e, D6 e, F6 q, D6 q | E6 h, C6 h | D6 q, F6 q, A5 q, D6 q | B5 q, D6 q, G5 h | F5 q, A5 q, G5 q, B5 q | C6 h., r q',
    },
  });
}
