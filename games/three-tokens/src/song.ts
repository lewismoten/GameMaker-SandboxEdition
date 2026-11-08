// KEYS AND DOORS's one song, "Three of a Kind": a puzzle-jazz tune in D dorian in its group's band
// (kit/starter/songStyle.ts: a lead over a walking bass, a held organ and a ride cymbal), an A and a B section played
// AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 108,
    A: {
      chords: 'Dm | G | Dm | G | Am | Dm | E7 | A7',
      tune: 'D5 q, F5 e, A5 e, C6 q, A5 q | B5 e, A5 e, G5 e, F5 e, D5 h | D5 q, F5 e, A5 e, D6 q, C6 q | B5 h., r q | A5 q, C6 e, E6 e, G6 q, E6 q | F6 e, E6 e, D6 e, C6 e, A5 h | G#5 q, B5 q, D6 q, B5 q | C#6 h, A5 h',
    },
    B: {
      chords: 'Gm | C7 | F | Dm | Gm | A7 | Dm | A7',
      tune: 'Bb5 q., A5 e, G5 q, D5 q | E5 q., G5 e, Bb5 h | A5 e, C6 e, F6 e, E6 e, C6 q, A5 q | D6 w | Bb5 q, D6 q, G6 q, D6 q | C#6 q, E6 q, G6 h | F6 e, E6 e, D6 e, A5 e, F5 q, D5 q | E5 h, C#5 h',
    },
  });
}
