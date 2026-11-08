// DON'T GET SEEN's one song, "Tiptoe" in A minor, played by its group's band (kit/starter/songStyle.ts: an organ
// doubled by brass, a pumping bass, strings and a stomping beat): its first eight bars are section A, with a B
// section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('foes', {
    bpm: 104,
    A: {
      chords: 'Am | Am | C | E | Am | Dm | F | Am',
      tune: 'A4 e, C5 e, E5 q, D5 e, C5 e, B4 q | A4 e, C5 e, E5 q, F5 e, E5 e, D5 q | C5 e, E5 e, G5 q, F5 e, E5 e, D5 q | E5 e, D5 e, C5 q, B4 h | A4 e, C5 e, E5 q, D5 e, C5 e, B4 q | D5 e, F5 e, A5 q, G5 e, F5 e, E5 q | F5 e, E5 e, D5 q, C5 e, B4 e, G#4 q | A4 e, C5 e, E5 q, A4 h',
    },
    B: {
      chords: 'F | G | Am | E | F | G | E | E',
      tune: 'A5 q, F5 e, A5 e, C6 q, A5 q | B5 q, G5 e, B5 e, D6 q, B5 q | C6 e, B5 e, A5 e, E5 e, C5 q, E5 q | G#5 h, B5 h | C6 q, A5 e, C6 e, F6 q, C6 q | D6 q, B5 e, D6 e, G6 q, D6 q | E6 e, D6 e, B5 e, G#5 e, E5 q, G#5 q | B5 h., r q',
    },
  });
}
