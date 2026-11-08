// WATCH YOUR STEP's one song, "Tiptoe" in A minor, played by its group's band (kit/starter/songStyle.ts: piano over
// an oom-pah pluck and a light kick): its first eight bars are section A, with a B section added, played AABA, 32
// bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 110,
    A: {
      chords: 'Am | Am | F | Am | Am | G | F | E',
      tune: 'A4 e, C5 e, E5 q, D5 e, C5 e, B4 q | C5 e, E5 e, A5 q, G5 h | F5 q, E5 e, D5 e, C5 q, D5 q | E5 q, C5 q, A4 h | A4 e, C5 e, E5 q, D5 e, C5 e, B4 q | G4 e, B4 e, D5 q, E5 h | F5 e, E5 e, D5 e, C5 e, B4 q, G4 q | A4 q, E4 q, A4 h',
    },
    B: {
      chords: 'C | G | Am | E | F | C | Dm | E',
      tune: 'C6 q, r e, B5 e, G5 q, E5 q | D5 q, r e, B4 e, D5 q, G5 q | A5 q, r e, G5 e, E5 q, C5 q | B4 h, G#4 h | A4 e, C5 e, F5 e, A5 e, C6 q, A5 q | G5 e, E5 e, C5 e, E5 e, G5 h | F5 q, A5 q, D6 q, A5 q | G#5 h., r q',
    },
  });
}
