// BIRDS OF A FEATHER's one song, "Swarm": a driving minor tune in C minor in its group's band
// (kit/starter/songStyle.ts: a lead doubled an octave down, a pumping bass, strings and a stomping beat), an A and a
// B section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('foes', {
    bpm: 138,
    A: {
      chords: 'Cm | Bb | Ab | G | Cm | Bb | Ab | G',
      tune: 'G5 e, Ab5 e, G5 e, Eb5 e, C5 q, Eb5 q | F5 e, G5 e, F5 e, D5 e, Bb4 q, D5 q | Eb5 e, F5 e, Eb5 e, C5 e, Ab4 q, C5 q | D5 e, Eb5 e, D5 e, B4 e, G4 h | G5 e, Ab5 e, G5 e, Eb5 e, C6 q, G5 q | Bb5 e, C6 e, Bb5 e, F5 e, D6 q, Bb5 q | C6 e, Bb5 e, Ab5 e, G5 e, F5 e, Eb5 e, D5 e, C5 e | B4 h., r q',
    },
    B: {
      chords: 'Fm | Cm | Fm | G | Ab | Eb | Fm G | Cm',
      tune: 'F5 q, Ab5 q, C6 q, F6 q | Eb6 q, C6 q, G5 h | Ab5 e, Bb5 e, C6 e, Ab5 e, F5 q, C6 q | B5 w | C6 q, Eb6 q, Ab6 q, Eb6 q | G6 q, Eb6 q, Bb5 h | Ab5 e, G5 e, F5 e, Ab5 e, G5 e, F5 e, D5 e, B4 e | C5 h., r q',
    },
  });
}
