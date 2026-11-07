// DAY AND NIGHT's one song, "Lamp Lighter" in C major, played by its group's band (kit/starter/songStyle.ts: a music
// box doubled by a flute over soft strings, no drums): its first eight bars are section A, with a B section added,
// played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('story', {
    bpm: 100,
    A: {
      chords: 'C | G | C | F | F | C | G | C',
      tune: 'E5 q, G5 q, E5 q, C5 q | D5 q, G5 q, D5 q, B4 q | E5 q, G5 q, C6 q, G5 q | A5 h, F5 h | F5 q, A5 q, F5 q, C5 q | E5 q, G5 q, E5 q, C5 q | D5 q, G5 q, B5 q, G5 q | C6 w',
    },
    B: {
      chords: 'Am | F | C | G | Am | F | Dm | G',
      tune: 'A5 h, C6 h | F5 h, A5 h | G5 q, C6 q, E6 q, C6 q | B5 w | A5 q, C6 q, E6 q, A6 q | F6 h, C6 h | D6 q, F6 q, A5 q, C6 q | B5 h, G5 h',
    },
  });
}
