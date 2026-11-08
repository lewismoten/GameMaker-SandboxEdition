// ROLL THE DICE's one song, "Lucky Roll": a puzzle-jazz tune in E minor in its group's band
// (kit/starter/songStyle.ts: a lead over a walking bass, a held organ and a ride cymbal) (here with a piano lead), an
// A and a B section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 112,
    lead: 'piano',
    A: {
      chords: 'Em | A | Em | B7 | Em | A | C | B7',
      tune: 'E5 e, G5 e, B5 e, D6 e, B5 q, G5 q | A5 q, C#6 e, A5 e, E5 h | G5 e, B5 e, E6 e, G6 e, F#6 q, E6 q | D#6 h., B5 q | E6 q, D6 e, B5 e, G5 q, E5 q | F#5 e, A5 e, C#6 e, E6 e, C#6 h | C6 q, B5 q, A5 q, G5 q | F#5 h, D#5 h',
    },
    B: {
      chords: 'Am | D | G | C | Am | B7 | Em | B7',
      tune: 'C6 q., B5 e, A5 q, E5 q | F#5 q., A5 e, D6 h | B5 e, D6 e, G6 e, D6 e, B5 q, G5 q | E5 q, G5 q, C6 h | A5 e, C6 e, E6 e, C6 e, A5 q, E6 q | D#6 q, B5 q, F#5 h | G5 q, B5 q, E6 q, G5 q | F#5 h., r q',
    },
  });
}
