// WARNING FIRST's one song, "Kite Day": a floating tune in G mixolydian in its group's band
// (kit/starter/songStyle.ts: a flute with a bell an octave up over a held pad and a slow pulse), an A and a B section
// played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('worlds', {
    bpm: 108,
    A: {
      chords: 'G | F | C | G | G | F | C | D',
      tune: 'G5 q., A5 e, B5 q, D6 q | C6 q., A5 e, F5 h | E5 q, G5 q, C6 q, E6 q | D6 w | B5 q., C6 e, D6 q, G6 q | F6 q., D6 e, C6 h | E6 q, C6 q, G5 q, E5 q | F#5 h., r q',
    },
    B: {
      chords: 'C | G | F | G | Em | C | Am | D',
      tune: 'E6 h, D6 q, C6 q | B5 h, G5 h | A5 q, C6 q, F6 q, C6 q | D6 w | B5 q, E6 q, G6 q, E6 q | C6 h, G5 h | A5 q, C6 q, E6 q, C6 q | D6 h., r q',
    },
  });
}
