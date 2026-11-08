// LOOKS LIKE A WALL's one song, "Speak Softly": a storybook tune in E-flat major in its group's band
// (kit/starter/songStyle.ts: a music box doubled by a flute over soft strings, no drums), an A and a B section played
// ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('story', {
    bpm: 86,
    A: {
      chords: 'Eb | Cm | Ab | Bb | Eb | Cm | Fm | Bb',
      tune: 'G5 h, Bb5 q, G5 q | Eb5 h, G5 q, C6 q | C6 q., Bb5 e, Ab5 q, F5 q | Bb5 w | G5 h, Bb5 q, Eb6 q | D6 q, C6 q, G5 h | Ab5 q, C6 q, F6 q, Eb6 q | D6 h., r q',
    },
    B: {
      chords: 'Ab | Eb | Fm | Bb | Ab | Eb | Bb | Eb',
      tune: 'C6 q, Eb6 q, Ab6 h | G6 q, Eb6 q, Bb5 h | Ab5 q, C6 q, F6 q., Eb6 e | D6 w | C6 q., Bb5 e, Ab5 q, Eb5 q | G5 q, Bb5 q, Eb6 h | D6 q, F6 q, Bb5 q, D6 q | Eb6 w',
    },
  });
}
