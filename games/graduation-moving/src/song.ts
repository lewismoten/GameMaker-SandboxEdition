// GRADUATION-MOVING's song, "Victory Lap": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Composed and arranged with OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('moving', {
    bpm: 140,
    A: {
      chords: 'D | Bm | G | A | D | G | Em A | D',
      tune: 'D5 e, A5 e, F#5 q, D6 q, A5 q | B5 q, F#5 e, B5 e, D6 h | G5 e, B5 e, D6 q, B5 e, A5 e, G5 q | E5 q, A5 q, C#6 h | D6 e, E6 e, F#6 q, A5 q, F#5 q | G5 q., B5 e, D6 q, B5 q | G5 q, E5 q, C#6 q, A5 q | F#5 e, A5 e, D6 h, r q',
    },
    B: {
      chords: 'Bm | F#m | G | D | Em | G | A7 | D',
      tune: 'F#5 q, B5 q, D6 e, C#6 e, B5 q | A5 e, F#5 e, C#5 q, F#5 h | B5 q, D6 q, G6 q, F#6 q | E6 e, D6 e, A5 h, F#5 q | G5 e, F#5 e, E5 q, B5 h | D6 q., B5 e, G5 q, D5 q | E5 q, G5 e, A5 e, C#6 q, E6 q | D6 h., r q',
    },
  });
}
