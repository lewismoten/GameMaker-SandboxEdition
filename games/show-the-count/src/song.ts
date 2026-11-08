// SHOW THE COUNT's one song, "Tally Marks": a puzzle-jazz tune in G minor in its group's band
// (kit/starter/songStyle.ts: a lead over a walking bass, a held organ and a ride cymbal), an A and a B section played
// AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 104,
    A: {
      chords: 'Gm | Cm | F | Bb | Eb | Cm | D | D7',
      tune: 'D5 q, G5 q, Bb5 q, r q | C5 q, Eb5 q, G5 q, r q | F5 e, G5 e, A5 e, C6 e, F6 h | D6 q, Bb5 q, F5 h | G5 e, Bb5 e, Eb6 q, D6 q, C6 q | Eb6 e, D6 e, C6 e, G5 e, Eb5 h | F#5 q, A5 q, D6 q, r q | C6 h, A5 h',
    },
    B: {
      chords: 'Cm | Gm | Cm | D | Eb | Bb | Cm D | Gm',
      tune: 'Eb6 q, r q, C6 q, G5 q | D6 q, r q, Bb5 q, G5 q | C6 e, D6 e, Eb6 e, G6 e, Eb6 q, C6 q | A5 h., F#5 q | G5 q, Bb5 q, Eb6 q, G6 q | F6 q, D6 q, Bb5 h | G5 q, C6 q, A5 q, D6 q | G5 h., r q',
    },
  });
}
