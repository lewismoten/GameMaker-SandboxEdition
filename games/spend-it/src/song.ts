// KEYS AND DOORS's one song, "Pocket Change": a clockwork tune in G major in its group's band
// (kit/starter/songStyle.ts: piano with a bell above, a walking bass, a pluck on every off-beat and a ticking hat),
// an A and a B section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 128,
    A: {
      chords: 'G | G | Am | D | G | G | C D | G',
      tune: 'G5 q, B5 e, A5 e, G5 q, D5 q | E5 e, F#5 e, G5 e, A5 e, B5 h | C6 q, A5 e, B5 e, C6 q, E5 q | F#5 e, G5 e, A5 e, F#5 e, D5 h | G5 q, B5 e, D6 e, G6 q, D6 q | E6 e, D6 e, C6 e, B5 e, A5 h | C6 q, E6 q, D6 q, F#6 q | G6 h., r q',
    },
    B: {
      chords: 'C | G | C | D | Em | Bm | C | D7',
      tune: 'E6 q, E6 e, D6 e, C6 q, G5 q | D6 q, D6 e, C6 e, B5 q, G5 q | C6 e, D6 e, E6 e, G6 e, E6 q, C6 q | A5 h, F#5 h | G5 q, B5 e, E6 e, G6 q, E6 q | F#6 q, D6 e, B5 e, F#5 q, D6 q | E6 e, D6 e, C6 e, B5 e, A5 e, G5 e, E5 e, G5 e | A5 h, C6 h',
    },
  });
}
