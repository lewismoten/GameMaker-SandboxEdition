// BEAT-THE-CLOCK's song, "Tick Tock": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Original A melody: Claude Sonnet 5.5.
// New B section and arrangement: OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 144,
    A: {
      chords: 'G | Em | C | G | C | G | D | G',
      tune: 'G5 e, G5 e, D5 q, G5 e, G5 e, D6 q | B5 e, B5 e, G5 q, B5 e, B5 e, D6 q | C6 e, C6 e, A5 q, C6 e, C6 e, E6 q | D6 e, B5 e, G5 q, D6 h | E6 e, E6 e, C6 q, E6 e, E6 e, G6 q | D6 e, D6 e, B5 q, D6 e, D6 e, B5 q | A5 e, D6 e, F#5 q, A5 e, D6 e, A5 q | G5 e, B5 e, D6 q, G6 h',
    },
    B: {
      chords: 'Em | Bm | C | G | Am | Em | D7 | G',
      tune: 'E6 q., B5 e, G5 q, B5 q | F#5 e, A5 e, B5 h, D6 q | E6 q, G6 q, E6 e, D6 e, C6 q | B5 h, D6 q, G5 q | A5 e, C6 e, E6 q, D6 q, C6 q | B5 q., G5 e, E5 h | F#5 e, A5 e, C6 q, D6 q, A5 q | B5 q, A5 q, G5 h',
    },
  });
}
