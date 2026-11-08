// GRADUATION-HEROES's song, "Take Your Bow": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Composed and arranged with OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('hero', {
    bpm: 120,
    A: {
      chords: 'Bb | Gm | Cm | F7 | Bb | Eb | Cm F7 | Bb',
      tune: 'D5 q., F5 e, Bb5 q, r q | A5 e., G5 s, D5 q, F5 h | Eb5 q, G5 e., Bb5 s, C6 q, G5 q | A5 h, F5 q, r q | Bb5 e., A5 s, F5 q, D5 q, F5 q | G5 q., Bb5 e, Eb6 h | C6 q, G5 q, A5 e., C6 s, Eb6 q | D6 h, Bb5 h',
    },
    B: {
      chords: 'Eb | Eb7 | Bb | G7 | Cm | F7 | Bb F7 | Bb',
      tune: 'G5 h, Bb5 q, Eb6 q | Db6 e., Bb5 s, G5 q, Eb5 h | F5 q, D5 q, Bb4 h | B4 e., D5 s, F5 q, G5 h | Eb5 q, G5 q, C6 q, Bb5 q | A5 q., C6 e, Eb6 q, C6 q | D6 q, Bb5 q, A5 q, F5 q | Bb5 h., r q',
    },
  });
}
