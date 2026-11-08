// GRAVITY ON AND OFF's one song, "Up and Down" in C major, played by its group's band (kit/starter/songStyle.ts: a
// flute with a bell an octave up over a held pad and a slow pulse): its first eight bars are section A, with a B
// section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('worlds', {
    bpm: 120,
    A: {
      chords: 'C | G | Dm | F | Em | G | Dm | C',
      tune: 'C5 q, E5 q, G5 q, C6 q | B5 q, G5 q, E5 h | D5 q, F5 q, A5 q, D6 q | C6 q, A5 q, F5 h | E5 q, G5 q, C6 q, E6 q | D6 q, B5 q, G5 h | A5 q, F5 q, D5 q, B4 q | C5 h, C5 h',
    },
    B: {
      chords: 'Am | F | C | G | Am | F | Dm | G',
      tune: 'C6 h, E6 h | F6 q, C6 q, A5 h | G5 q, C6 q, E6 q, G6 q | D6 w | E6 h, C6 h | A5 q, C6 q, F6 h | F6 q, D6 q, A5 q, F5 q | G5 h, B5 h',
    },
  });
}
