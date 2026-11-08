// GRADUATION-BASICS's song, "Up the Aisle": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Original A melody: Claude Sonnet 5.5.
// New B section and arrangement: OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 104,
    A: {
      chords: 'F | Bb | F | C | F | Bb | C | F',
      tune: 'F5 q, F5 e, G5 e, A5 h | G5 q, G5 e, A5 e, Bb5 h | A5 q, C6 q, A5 q, F5 q | G5 q, E5 q, F5 h | C6 q, C6 e, Bb5 e, A5 h | Bb5 q, Bb5 e, A5 e, G5 h | A5 q, F5 q, G5 q, E5 q | F5 w',
    },
    B: {
      chords: 'Dm | Am | Bb | F | Gm | Dm | C7 | F',
      tune: 'A5 h, F5 q, D5 q | E5 q, A5 q, C6 h | D6 q, Bb5 e, A5 e, G5 q, F5 q | A5 h, C6 h | Bb5 e, A5 e, G5 q, D6 q, Bb5 q | A5 q, F5 q, D5 h | E5 q, G5 q, Bb5 q, C6 q | A5 h, F5 h',
    },
  });
}
