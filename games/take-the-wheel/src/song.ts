// TAKE THE WHEEL's one song, "Road Trip" in C major, played by its group's band (kit/starter/songStyle.ts: a reed
// over a walking bass, electric piano on the off-beats and a shuffle): its first eight bars are section A, with a B
// section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('hero', {
    bpm: 120,
    A: {
      chords: 'C | F | G | C | F | G | Am | G',
      tune: 'C5 e, E5 e, G5 q, E5 q, C5 q | F5 e, A5 e, C6 q, A5 q, F5 q | G5 e, B5 e, D6 q, B5 q, G5 q | E6 q, C6 q, G5 h | A5 e, C6 e, F6 q, C6 q, A5 q | B5 e, D6 e, G6 q, D6 q, B5 q | C6 q, E6 q, A5 q, C6 q | D6 q, B5 q, C6 h',
    },
    B: {
      chords: 'Am | Em | F | C | Dm | G | F | G',
      tune: 'A5 e., C6 s, E6 q, A6 q, E6 q | G5 e., B5 s, E6 h, B5 q | A5 e., C6 s, F6 e., C6 s, A5 q, F5 q | E5 e., G5 s, C6 h, G5 q | F5 e., A5 s, D6 e., F6 s, D6 q, A5 q | B5 e., G5 s, D5 e., G5 s, B5 h | A5 q, C6 q, F6 q, A5 q | G5 h., r q',
    },
  });
}
