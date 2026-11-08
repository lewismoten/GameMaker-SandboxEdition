// TRY AGAIN's one song, "Once More" in C major, played by its group's band (kit/starter/songStyle.ts: piano with a
// bell above, a walking bass, a pluck on every off-beat and a ticking hat): its first eight bars are section A, with
// a B section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 120,
    A: {
      chords: 'C | F | G | C | C | F | G | C',
      tune: 'C5 e, E5 e, G5 q, E5 e, C5 e, G4 q | F4 e, A4 e, C5 q, A4 e, F4 e, C5 q | G4 e, B4 e, D5 q, G5 e, F5 e, D5 q | E5 q, D5 q, C5 h | C5 e, E5 e, G5 q, C6 e, G5 e, E5 q | A5 e, F5 e, C5 q, F5 h | G5 e, F5 e, D5 e, B4 e, D5 q, G5 q | C5 q, G4 q, C5 h',
    },
    B: {
      chords: 'F | G | Em | Am | F | G | Dm | G',
      tune: 'A5 e, C6 e, F6 q, C6 e, A5 e, F5 q | G5 e, B5 e, D6 q, B5 e, G5 e, D5 q | E5 e, G5 e, B5 q, E6 e, B5 e, G5 q | A5 h, E5 h | F5 e, A5 e, C6 e, F6 e, A6 q, F6 q | G6 e, F6 e, D6 e, B5 e, G5 h | F5 q, A5 q, D6 q, F6 q | D6 h, B5 h',
    },
  });
}
