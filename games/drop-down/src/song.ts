// DROP DOWN's one song, "Feather Fall": a floating tune in D lydian in its group's band (kit/starter/songStyle.ts: a
// flute with a bell an octave up over a held pad and a slow pulse), an A and a B section played AABA, 32 bars before
// it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('worlds', {
    bpm: 96,
    A: {
      chords: 'D | E | D | E | Bm | G | A | D',
      tune: 'A5 h, F#5 q, A5 q | G#5 h, E5 h | F#5 q, A5 q, D6 q, A5 q | B5 w | D6 q, C#6 q, B5 q, F#5 q | G5 h, B5 h | A5 q, G5 q, E5 q, C#5 q | D5 w',
    },
    B: {
      chords: 'G | A | F#m | Bm | G | A | E | A',
      tune: 'B5 q., A5 e, G5 h | C#6 q., B5 e, A5 h | F#5 q, A5 q, C#6 q, E6 q | D6 w | B5 q, D6 q, G6 h | E6 q, C#6 q, A5 h | G#5 q, B5 q, E6 q, D6 q | C#6 h, A5 h',
    },
  });
}
