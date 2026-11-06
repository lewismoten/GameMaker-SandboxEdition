// GRADUATION-BLOCKS's song, "Colors on the Wall": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Composed and arranged with OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('drawing', {
    bpm: 84,
    A: {
      chords: 'A | F#m | D | E | C#m | D | Bm E | A',
      tune: 'E5 h, C#6 h | A5 q, F#5 h, C#5 q | D5 h., F#5 q | G#5 q, B5 q, E6 h | C#6 h, G#5 q, E5 q | F#5 e, A5 e, D6 h, C#6 q | B5 h, G#5 h | A5 w',
    },
    B: {
      chords: 'F#m | D | A | E | Bm | F#m | D E | A',
      tune: 'C#6 q, F#6 h, E6 q | D6 h, A5 q, F#5 q | E5 q., C#5 e, A4 h | B4 h, E5 h | F#5 q, B5 q, D6 h | C#6 e, A5 e, F#5 h, E5 q | F#5 q, A5 q, G#5 q, B5 q | A5 h, A4 h',
    },
  });
}
