// COUNTDOWN's song, "Down to Zero": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Composed and arranged with OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 128,
    A: {
      chords: 'C | Am | F | G | Em | F | Dm G | C',
      tune: 'E6 h, D6 q, C6 q | A5 q., C6 e, E6 q, r q | C6 q, A5 q, F5 h | B5 e, A5 e, G5 q, D6 h | B5 h, G5 q, E5 q | A5 q, C6 e, A5 e, F5 q, r q | F5 q, A5 q, G5 q, B5 q | C6 h., r q',
    },
    B: {
      chords: 'Am | Em | F | C | Dm | Am | G7 | C',
      tune: 'A5 e, B5 e, C6 q, E6 h | D6 q, B5 q, G5 q, r q | A5 h, F5 e, G5 e, A5 q | G5 q., E5 e, C5 h | D5 q, F5 q, A5 e, C6 e, D6 q | E6 q, C6 q, A5 h | B5 e, D6 e, F6 q, D6 q, B5 q | C6 w',
    },
  });
}
