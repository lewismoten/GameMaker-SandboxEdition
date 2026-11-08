// KIT'S MOVES's one song, "Kit Struts": a swing tune in B-flat major in its group's band (kit/starter/songStyle.ts: a
// lead over a walking bass, electric piano on the off-beats and a shuffle), an A and a B section played AABA, 32 bars
// before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('hero', {
    bpm: 118,
    A: {
      chords: 'Bb | Gm | Cm | F | Bb | Eb | Bb F | Bb',
      tune: 'F5 e., D5 s, F5 e., G5 s, Bb5 q, F5 q | G5 e., Bb5 s, D6 q, Bb5 h | C6 e., Bb5 s, G5 e., Eb5 s, C5 q, Eb5 q | F5 h., r q | F5 e., D5 s, F5 e., G5 s, Bb5 q, D6 q | Eb6 q, C6 q, G5 h | F5 e., G5 s, Bb5 e., C6 s, D6 q, C6 q | Bb5 h., r q',
    },
    B: {
      chords: 'Eb | Bb | Eb | F | Dm | Gm | C7 | F',
      tune: 'G5 q, Bb5 q, Eb6 e., D6 s, C6 q | D6 h, Bb5 h | G5 e., A5 s, Bb5 e., C6 s, Eb6 q, G6 q | F6 w | F6 e., E6 s, D6 e., C6 s, A5 q, F5 q | G5 e., A5 s, Bb5 e., D6 s, G6 h | E6 q, C6 q, Bb5 q, G5 q | A5 h, C5 h',
    },
  });
}
