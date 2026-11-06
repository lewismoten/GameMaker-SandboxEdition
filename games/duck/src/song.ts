// KIT DUCKS's one song, "Low Bridge": a swing tune in F major in its group's band (kit/starter/songStyle.ts: a lead
// over a walking bass, electric piano on the off-beats and a shuffle), an A and a B section played AABA, 32 bars
// before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('hero', {
    bpm: 114,
    A: {
      chords: 'F | D7 | Gm | C7 | F | D7 | Gm C7 | F',
      tune: 'C5 q, F5 e., A5 s, C6 q, A5 q | F#5 q, A5 e., C6 s, D6 h | Bb5 e., A5 s, G5 e., D5 s, Bb4 q, D5 q | E5 h., r q | C5 q, F5 e., A5 s, C6 q, F6 q | D6 e., C6 s, A5 e., F#5 s, D6 h | Bb5 e., G5 s, D5 e., Bb4 s, C5 e., E5 s, G5 e., Bb5 s | A5 h., r q',
    },
    B: {
      chords: 'Bb | F | Bb | C | Am | Dm | G7 | C7',
      tune: 'D6 q, Bb5 q, F5 q, Bb5 q | A5 e., G5 s, F5 e., C5 s, F5 h | D6 e., C6 s, Bb5 e., A5 s, Bb5 q, D6 q | C6 w | C6 e., B5 s, A5 e., E5 s, C5 q, E5 q | F5 e., A5 s, D6 e., F6 s, D6 h | B5 q, G5 q, D5 q, F5 q | E5 h, G5 h',
    },
  });
}
