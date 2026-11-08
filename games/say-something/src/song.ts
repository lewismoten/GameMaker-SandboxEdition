// SAY SOMETHING's one song, "Once Upon": a storybook tune in G major in its group's band (kit/starter/songStyle.ts: a
// music box doubled by a flute over soft strings, no drums), an A and a B section played ABAB, 32 bars before it
// loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('story', {
    bpm: 92,
    A: {
      chords: 'G | Em | C | D | G | Em | Am | D',
      tune: 'D5 q, G5 q, B5 q., A5 e | G5 q, E5 q, B4 h | C5 q, E5 q, G5 q., E5 e | D5 h., r q | D5 q, G5 q, B5 q., D6 e | E6 q, B5 q, G5 h | A5 q, C6 q, E6 q., D6 e | C6 h, A5 h',
    },
    B: {
      chords: 'C | G | Am | Em | C | G | D | G',
      tune: 'E6 q., D6 e, C6 q, G5 q | B5 q., A5 e, G5 h | A5 q, B5 q, C6 q, E6 q | B5 w | C6 q., B5 e, A5 q, E5 q | D5 q, G5 q, B5 h | A5 q., G5 e, F#5 q, A5 q | G5 w',
    },
  });
}
