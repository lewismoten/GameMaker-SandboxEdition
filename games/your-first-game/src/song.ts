// YOUR FIRST GAME's one song, "Start Here": a clockwork tune in D major in its group's band
// (kit/starter/songStyle.ts: piano with a bell above, a walking bass, a pluck on every off-beat and a ticking hat),
// an A and a B section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 132,
    A: {
      chords: 'D | Bm | G | A | D | Bm | Em A | D',
      tune: 'A4 q, D5 q, F#5 q, A5 q | B5 h, F#5 h | G5 e, F#5 e, E5 e, D5 e, B4 q, D5 q | E5 h., A4 q | D5 q, F#5 q, A5 q, D6 q | D6 e, C#6 e, B5 e, A5 e, F#5 h | G5 q, B5 q, A5 q, C#6 q | D6 h., r q',
    },
    B: {
      chords: 'G | D | G | A | Bm | F#m | G | A',
      tune: 'B5 q, G5 q, D6 q, B5 q | A5 q, F#5 q, D5 h | G5 e, A5 e, B5 e, C#6 e, D6 q, G6 q | E6 w | F#6 q, D6 q, B5 q, F#5 q | A5 q, C#6 q, F#6 h | E6 e, D6 e, B5 e, G5 e, E5 q, G5 q | A5 h., r q',
    },
  });
}
