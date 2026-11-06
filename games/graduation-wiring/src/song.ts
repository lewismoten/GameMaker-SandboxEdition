// GRADUATION-WIRING's song, "Circuit Complete": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Composed and arranged with OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 112,
    A: {
      chords: 'C | Am7 | Dm7 | G7 | Em7 | A7 | Dm7 G7 | C',
      tune: 'E5 e, G5 e, B5 q, D6 q, r q | C6 q., A5 e, G5 h | F5 q, A5 q, C6 e, E6 e, D6 q | B5 q, F5 q, A5 h | G5 e, B5 e, D6 h, E6 q | C#6 q, A5 e, G5 e, E5 h | F5 q, D5 q, G5 e, B5 e, D6 q | E6 h, C6 h',
    },
    B: {
      chords: 'F | Fm | C | Am7 | Dm7 | G7 | Em7 A7 | Dm7 G7',
      tune: 'A5 h, E6 q, C6 q | Ab5 q., C6 e, F6 h | E6 e, D6 e, B5 q, G5 h | A5 q, C6 q, E6 q, G6 q | F6 h, E6 e, D6 e, C6 q | B5 q, D6 q, F6 h | E6 q, B5 q, C#6 q, A5 q | D6 q, C6 q, B5 h',
    },
  });
}
