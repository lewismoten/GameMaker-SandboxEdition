// MEET THE MONSTERS's one song, "Boing Boing, Hello" in G major, played by its group's band
// (kit/starter/songStyle.ts: piano over an oom-pah pluck and a light kick): its first eight bars are section A, with
// a B section added, played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 126,
    A: {
      chords: 'G | C | G | Am | G | C | Am | G',
      tune: 'G4 e, B4 e, D5 q, D5 e, E5 e, D5 q | C5 e, E5 e, G5 q, G5 e, F5 e, E5 q | D5 e, G5 e, B5 q, B5 e, A5 e, G5 q | A4 e, C5 e, E5 q, A5 q, E5 q | B4 e, D5 e, G5 q, G5 e, A5 e, G5 q | E5 e, G5 e, C6 q, B5 e, A5 e, G5 q | A5 e, G5 e, E5 q, C5 e, D5 e, E5 q | G5 q, D5 q, G4 h',
    },
    B: {
      chords: 'C | D | G | Em | C | D | Am | D',
      tune: 'E5 q, G5 q, C6 q, G5 q | F#5 q, A5 q, D6 h | B5 q., A5 e, G5 q, D5 q | E5 q, G5 q, B5 h | C6 e, B5 e, A5 e, G5 e, E5 q, C6 q | A5 q, F#5 q, D5 h | C5 q, E5 q, A5 q, C6 q | D6 h, F#5 h',
    },
  });
}
