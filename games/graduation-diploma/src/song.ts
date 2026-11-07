// GRADUATION-DIPLOMA's song, "Make Something Wonderful": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Composed and arranged with OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('showcase', {
    bpm: 128,
    A: {
      chords: 'F | Dm | Bb | C | F | Gm | C7 | F',
      tune: 'C5 q, F5 e, A5 e, C6 h | D6 q., A5 e, F5 q, D5 q | F5 e, Bb5 e, D6 q, F6 q, D6 q | E6 h, C6 q, G5 q | A5 q, C6 q, F6 e, E6 e, C6 q | Bb5 q, D6 e, C6 e, Bb5 q, G5 q | E5 e, G5 e, Bb5 q, C6 h | A5 h, F5 h',
    },
    B: {
      chords: 'Bb | F | Gm | Dm | Bb | G7 | C7 | F',
      tune: 'D6 h, F6 q, Bb5 q | C6 q, A5 e, F5 e, C5 h | D5 e, G5 e, Bb5 q, D6 h | C6 q, A5 q, F5 h | Bb5 q, D6 q, F6 q, D6 q | B5 q., D6 e, G6 q, F6 q | E6 e, C6 e, Bb5 q, G5 q, E5 q | F5 h., r q',
    },
  });
}
