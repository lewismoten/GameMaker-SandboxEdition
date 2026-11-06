// THREE PHASES's one song, "Second Wind": a driving minor tune in D minor in its group's band
// (kit/starter/songStyle.ts: a lead doubled an octave down, a pumping bass, strings and a stomping beat), an A and a
// B section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('foes', {
    bpm: 132,
    A: {
      chords: 'Dm | C | Bb | A | Dm | C | Bb | A',
      tune: 'D5 q, A5 q, F5 e, E5 e, D5 q | C5 q, G5 q, E5 e, D5 e, C5 q | Bb4 e, D5 e, F5 e, Bb5 e, A5 q, F5 q | E5 q, C#5 q, A4 h | D5 q, A5 q, D6 e, C6 e, A5 q | C6 e, Bb5 e, A5 e, G5 e, E5 h | F5 e, G5 e, A5 e, Bb5 e, D6 q, Bb5 q | A5 h., r q',
    },
    B: {
      chords: 'Gm | Dm | Gm | A | Bb | F | Gm | A',
      tune: 'G5 q., Bb5 e, D6 h | F5 q., A5 e, D6 h | G5 e, A5 e, Bb5 e, D6 e, G6 q, D6 q | E6 w | F6 q, D6 q, Bb5 q, F5 q | A5 q, C6 q, F6 h | E6 e, D6 e, Bb5 e, G5 e, D5 q, G5 q | C#5 h., r q',
    },
  });
}
