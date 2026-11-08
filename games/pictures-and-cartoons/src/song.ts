// PICTURES AND CARTOONS's one song, "Picture Show" in C major, played by its group's band (kit/starter/songStyle.ts:
// a music box doubled by a flute over soft strings, no drums): its first eight bars are section A, with a B section
// added, played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('story', {
    bpm: 116,
    A: {
      chords: 'C | G | Am | F | C | G | F | C',
      tune: 'E5 q, G5 q, E5 q, C5 q | D5 q, G5 q, B5 h | C6 q, A5 q, E5 q, A5 q | A5 h, F5 h | G5 e, E5 e, G5 q, C6 q, G5 q | B5 q, D6 q, G5 h | A5 q, F5 q, C6 q, A5 q | G5 q, D5 q, C5 h',
    },
    B: {
      chords: 'Am | Em | F | G | Am | Em | Dm | G',
      tune: 'C6 q., B5 e, A5 h | B5 q., A5 e, G5 h | A5 q, C6 q, F6 q, C6 q | D6 w | E6 q., D6 e, C6 h | B5 q, G5 q, E5 h | F5 q, A5 q, D6 q, F6 q | D6 h, B5 h',
    },
  });
}
