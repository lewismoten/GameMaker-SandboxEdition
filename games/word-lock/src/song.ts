// KEYS AND DOORS's one song, "Letter by Letter": a puzzle-jazz tune in C minor in its group's band
// (kit/starter/songStyle.ts: a lead over a walking bass, a held organ and a ride cymbal), an A and a B section played
// AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 100,
    A: {
      chords: 'Cm | F7 | Cm | F7 | Bb | Eb | Ab | G',
      tune: 'C5 q., Eb5 e, G5 q, Bb5 q | A5 q, F5 q, Eb5 h | C5 q., Eb5 e, G5 q, C6 q | A5 h., r q | Bb5 q, D6 q, F6 q, D6 q | Eb6 q, G5 q, Bb5 h | C6 e, Bb5 e, Ab5 e, G5 e, F5 q, Eb5 q | D5 h, B4 h',
    },
    B: {
      chords: 'Ab | Bb | Eb | Cm | Fm | G | Cm | G',
      tune: 'C6 e, Eb6 e, Ab6 q, Eb6 q, C6 q | D6 e, F6 e, Bb6 q, F6 q, D6 q | Eb6 h, G5 h | C6 h, Eb5 h | F5 q, Ab5 q, C6 q, F6 q | D6 q, B5 q, G5 h | Eb6 q, D6 q, C6 q, G5 q | B5 h., r q',
    },
  });
}
