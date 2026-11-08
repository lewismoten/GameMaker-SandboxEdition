// UNDER THE SURFACE's one song, "Deep Blue Drift": a floating tune in D minor in its group's band
// (kit/starter/songStyle.ts: a flute with a bell an octave up over a held pad and a slow pulse), an A and a B section
// played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('worlds', {
    bpm: 100,
    A: {
      chords: 'Dm | Bb | F | C | Dm | Bb | Gm | A',
      tune: 'D5 q, F5 q, A5 h | Bb5 q, A5 q, F5 h | C6 h, A5 q, F5 q | G5 w | A5 q, D6 q, C6 q, A5 q | Bb5 h, G5 h | G5 q, Bb5 q, A5 q, G5 q | E5 h., C#5 q',
    },
    B: {
      chords: 'F | C | Dm | A | Bb | F | Gm | A',
      tune: 'A5 q, C6 q, F6 h | E6 q, D6 q, C6 h | D6 q., C6 e, A5 h | C#6 w | D6 q, Bb5 q, F5 q, Bb5 q | A5 q, F5 q, C5 h | D5 q, G5 q, Bb5 q, D6 q | C#6 h., r q',
    },
  });
}
