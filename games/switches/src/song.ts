// SWITCHES's one song, "Click" in C major, played by its group's band (kit/starter/songStyle.ts: electric piano over
// a walking bass, a held organ and a ride cymbal): its first eight bars are section A, with a B section added, played
// AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 110,
    A: {
      chords: 'C | C | F | C | C | Dm | F | G',
      tune: 'C5 e, E5 e, G5 q, E5 e, C5 e, D5 q | E5 e, G5 e, C6 q, B5 h | A5 q, G5 e, F5 e, E5 q, F5 q | G5 q, E5 q, C5 h | C5 e, E5 e, G5 q, E5 e, C5 e, D5 q | D5 e, F5 e, A5 q, G5 h | A5 e, G5 e, F5 e, E5 e, D5 q, B4 q | C5 q, G4 q, C5 h',
    },
    B: {
      chords: 'Am | Dm | G | C | F | Dm | E7 | G',
      tune: 'A5 q., C6 e, E6 q, C6 q | D6 q., A5 e, F5 h | G5 e, B5 e, D6 e, F6 e, E6 q, D6 q | C6 h, G5 h | A5 q., C6 e, F6 q, C6 q | D6 q., F6 e, A5 h | G#5 q, B5 q, D6 q, E6 q | G5 h., r q',
    },
  });
}
