// WARNING-FIRST's song, "Look Then Leap": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Composed and arranged with OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 116,
    A: {
      chords: 'Dm | Bb | F | A7 | Dm | Gm | A7 | Dm',
      tune: 'A5 q, r e, A5 e, F5 q, D5 q | F5 h, D5 q, Bb4 q | C5 e, F5 e, A5 q, G5 h | E5 q., G5 e, C#6 q, A5 q | D6 q, A5 h, F5 q | G5 e, A5 e, Bb5 q, D6 h | C#6 q, A5 q, E5 q, G5 q | F5 h, D5 h',
    },
    B: {
      chords: 'F | C | Gm | Dm | Bb | Gm | A7 | Dm',
      tune: 'A5 e, C6 e, F6 h, E6 q | D6 q, E6 e, D6 e, C6 h | Bb5 q., G5 e, D6 q, Bb5 q | A5 h, F5 q, r q | F5 q, Bb5 q, D6 q, F6 q | D6 e, Bb5 e, G5 h, Bb5 q | A5 q, G5 e, E5 e, C#5 q, E5 q | D5 w',
    },
  });
}
