// THE GIANT's one song, "Heavy Feet": a driving minor tune in E minor in its group's band (kit/starter/songStyle.ts:
// a lead doubled an octave down, a pumping bass, strings and a stomping beat) (here with a brass lead), an A and a B
// section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('foes', {
    bpm: 126,
    lead: 'brass',
    A: {
      chords: 'Em | Em | C | B | Em | Em | Am | B',
      tune: 'E5 h, B4 q, E5 q | G5 h, F#5 q, E5 q | C5 q, E5 q, G5 q, C6 q | B5 h., r q | E5 h, G5 q, B5 q | E6 h, D6 q, B5 q | C6 q, A5 q, E5 q, C5 q | D#5 h., r q',
    },
    B: {
      chords: 'C | D | G | Em | C | D | B | B',
      tune: 'E5 q, G5 q, C6 h | D6 q, A5 q, F#5 h | G5 e, A5 e, B5 e, D6 e, G6 h | E6 q, B5 q, G5 h | C6 q, E6 q, G6 q, E6 q | F#6 q, D6 q, A5 h | B5 q, D#6 q, F#6 q, D#6 q | B5 h, F#5 h',
    },
  });
}
