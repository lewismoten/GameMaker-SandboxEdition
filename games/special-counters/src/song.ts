// KEYS AND DOORS's one song, "Odd Numbers": a puzzle-jazz tune in F minor in its group's band
// (kit/starter/songStyle.ts: a lead over a walking bass, a held organ and a ride cymbal), an A and a B section played
// AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 112,
    A: {
      chords: 'Fm | Db | Bb | C | Fm | Db | Bbm | C',
      tune: 'F5 e, Ab5 e, r e, C6 e, F6 q, C6 q | Db6 e, C6 e, r e, Ab5 e, F5 h | Bb5 e, Db6 e, r e, F6 e, Db6 q, Bb5 q | C6 h., E5 q | F5 e, Ab5 e, r e, C6 e, Eb6 q, Db6 q | C6 e, Ab5 e, r e, F5 e, Db5 h | Db5 e, F5 e, Bb5 e, Db6 e, F6 q, Db6 q | E6 h, C6 h',
    },
    B: {
      chords: 'Db | Ab | Bbm | C | Db | Ab | Bbm C | Fm',
      tune: 'F6 q., Eb6 e, Db6 q, Ab5 q | C6 q., Bb5 e, Ab5 h | Bb5 e, Db6 e, F6 e, Db6 e, Bb5 q, F5 q | G5 h, E5 h | F5 q, Ab5 q, Db6 q, F6 q | Eb6 q, C6 q, Ab5 h | Bb5 q, Db6 q, C6 q, G5 q | F5 h., r q',
    },
  });
}
