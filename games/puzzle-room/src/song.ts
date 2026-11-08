// SWITCHES's one song, "Click Into Place": a clockwork tune in A minor in its group's band (kit/starter/songStyle.ts:
// piano with a bell above, a walking bass, a pluck on every off-beat and a ticking hat), an A and a B section played
// AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 124,
    A: {
      chords: 'Am | G | F | E | Am | G | F | E',
      tune: 'A5 q, r e, C6 e, B5 q, E5 q | G5 q, r e, B5 e, A5 q, D5 q | F5 q, r e, A5 e, G5 q, C5 q | E5 e, F5 e, G#5 e, B5 e, E6 h | A5 q, r e, C6 e, E6 q, A6 q | G6 q, r e, F6 e, E6 q, D6 q | C6 e, D6 e, E6 e, C6 e, A5 q, F5 q | E5 h., r q',
    },
    B: {
      chords: 'Dm | Am | Dm | E | F | C | Dm E | Am',
      tune: 'F5 q., A5 e, D6 q, A5 q | C6 q., B5 e, A5 h | F5 e, A5 e, D6 e, F6 e, E6 q, D6 q | B5 h, G#5 h | A5 q., C6 e, F6 q, C6 q | E6 q., D6 e, C6 h | D6 q, F6 q, E6 q, B5 q | A5 h., r q',
    },
  });
}
