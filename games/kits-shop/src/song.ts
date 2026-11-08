// KEYS AND DOORS's one song, "Shop Bell": a clockwork tune in B-flat major in its group's band
// (kit/starter/songStyle.ts: piano with a bell above, a walking bass, a pluck on every off-beat and a ticking hat)
// (here with a electric piano lead), an A and a B section played AABA, 32 bars before it loops. It plays on the
// title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 124,
    lead: 'epiano',
    A: {
      chords: 'Bb | Eb | F | Bb | Gm | Cm | F | F',
      tune: 'F5 q, Bb5 q, D6 q, C6 e, Bb5 e | G5 q, Bb5 q, Eb6 h | C6 q, A5 q, F5 q, A5 q | Bb5 h., r q | D6 q, Bb5 q, G5 q, Bb5 q | Eb6 q, C6 q, G5 h | F5 e, G5 e, A5 e, Bb5 e, C6 q, Eb6 q | D6 h, C6 h',
    },
    B: {
      chords: 'Eb | Bb | Eb | F | Dm | Gm | Cm F | Bb',
      tune: 'G5 e, Bb5 e, Eb6 q, G6 q, Eb6 q | F6 e, D6 e, Bb5 q, F5 h | G5 e, Bb5 e, Eb6 q, D6 q, C6 q | A5 w | A5 e, D6 e, F6 q, D6 q, A5 q | Bb5 e, D6 e, G6 q, D6 q, Bb5 q | G5 q, Eb6 q, C6 q, A5 q | Bb5 h., r q',
    },
  });
}
