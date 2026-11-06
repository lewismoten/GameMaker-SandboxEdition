// GRADUATION-STORY's song, "The Last Page Turns": original music for this project, arranged in its group's band.
// Two eight-bar sections make a 32-bar loop. Composed and arranged with OpenAI Codex.
import { starterSong } from '../../kit/starter/songStyle';

/** The game's original score as a Sound Blaster .CMF. */
export function song(): Uint8Array {
  return starterSong('story', {
    bpm: 92,
    A: {
      chords: 'Eb | Cm | Ab | Bb | Gm | Ab | Fm Bb | Eb',
      tune: 'G5 h., F5 q | Eb5 q, G5 e, Bb5 e, C6 h | Eb6 h, C6 q, Ab5 q | D6 q, Bb5 q, F5 h | G5 q, Bb5 q, D6 h | C6 e, Bb5 e, Ab5 h, G5 q | F5 h, D5 q, F5 q | Eb5 w',
    },
    B: {
      chords: 'Cm | Ab | Eb | Bb | Fm | Cm | Ab Bb | Eb',
      tune: 'C6 q, G5 h, Eb5 q | Ab5 h, C6 e, Eb6 e, C6 q | Bb5 q., G5 e, Eb5 h | F5 q, Bb5 q, D6 h | C6 q, Ab5 q, F5 q, C5 q | Eb5 e, G5 e, C6 h, Bb5 q | Ab5 q, C6 q, Bb5 q, D6 q | Eb6 h, Eb5 h',
    },
  });
}
