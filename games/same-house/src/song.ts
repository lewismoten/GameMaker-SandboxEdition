// THE SAME HOUSE's one song, "Welcome Mat" in G major, played by its group's band (kit/starter/songStyle.ts: a music
// box doubled by a flute over soft strings, no drums): its first eight bars are section A, with a B section added,
// played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('story', {
    bpm: 110,
    A: {
      chords: 'G | C | G | D | C | D | G | G',
      tune: 'B4 q, D5 q, G5 q, D5 q | C5 q, E5 q, A5 q, E5 q | B4 q, D5 q, G5 q, B5 q | A5 h, D5 h | E5 q, G5 q, C6 q, G5 q | D5 q, F5 q, B5 q, F5 q | G5 q, B5 q, D6 q, B5 q | G5 w',
    },
    B: {
      chords: 'Em | C | G | D | Em | C | Am | D',
      tune: 'B5 h, G5 q, E5 q | C6 h, G5 q, E5 q | D5 q, G5 q, B5 q, D6 q | A5 w | B5 q., C6 e, D6 h | E6 q., D6 e, C6 h | A5 q, C6 q, E6 q, C6 q | D6 h, F#5 h',
    },
  });
}
