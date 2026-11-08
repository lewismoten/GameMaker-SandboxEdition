// BOTH TOGETHER's one song, "Humming Wires" in G major, played by its group's band (kit/starter/songStyle.ts:
// electric piano over a walking bass, a held organ and a ride cymbal): its first eight bars are section A, with a B
// section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('wiring', {
    bpm: 104,
    A: {
      chords: 'G | C | G | Em | C | F | Em | G',
      tune: 'G5 q, B5 q, D6 q, B5 q | C6 q, E6 q, C6 h | D6 q, B5 q, G5 q, A5 q | B5 h, G5 h | E5 q, G5 q, C6 q, G5 q | A5 q, F5 q, D5 h | G5 q, B5 q, E6 q, D6 q | D6 q, B5 q, G5 h',
    },
    B: {
      chords: 'Em | Am | D | G | C | Am | D | D7',
      tune: 'E6 q., D6 e, B5 q, G5 q | A5 q., C6 e, E6 h | F#6 e, E6 e, D6 e, A5 e, F#5 q, A5 q | G5 h, B5 h | C6 q, E6 q, G6 q, E6 q | C6 q., B5 e, A5 h | F#5 q, A5 q, D6 q, F#6 q | C6 h, A5 h',
    },
  });
}
