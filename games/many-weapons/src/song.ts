// MANY WEAPONS's one song, "Arsenal Hop": a running chip tune in C minor in its group's band
// (kit/starter/songStyle.ts: a square lead with its octave above, a bass in eighths and a busy beat), an A and a B
// section played AABB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('moving', {
    bpm: 144,
    A: {
      chords: 'Cm | Cm | Ab | Bb | Cm | Cm | Fm | G',
      tune: 'C5 e, r e, C5 e, Eb5 e, G5 q, Eb5 q | F5 e, G5 e, F5 e, Eb5 e, D5 h | C5 e, r e, C5 e, Eb5 e, Ab5 q, G5 q | F5 e, D5 e, Bb4 e, D5 e, F5 h | G5 e, r e, G5 e, Bb5 e, C6 q, G5 q | Bb5 e, Ab5 e, G5 e, F5 e, Eb5 h | F5 e, Ab5 e, C6 e, Ab5 e, F5 q, Ab5 q | G5 h, B4 h',
    },
    B: {
      chords: 'Ab | Bb | Eb | Cm | Ab | Bb | G | G',
      tune: 'Eb5 q, Ab5 q, C6 q, Ab5 q | D5 q, F5 q, Bb5 q, F5 q | G5 e, F5 e, Eb5 e, G5 e, Bb5 h | C6 e, Bb5 e, G5 e, Eb5 e, C5 h | Ab5 e, Ab5 e, G5 e, F5 e, Eb5 q, C5 q | D5 e, F5 e, Bb5 e, D6 e, Bb5 h | B5 q, G5 q, D5 q, B4 q | D5 e, F5 e, G5 e, B5 e, G5 h',
    },
  });
}
