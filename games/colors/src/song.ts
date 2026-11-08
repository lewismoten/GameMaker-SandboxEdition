// COLORS THAT WORK's one song, "Paint Box": a storybook tune in A major in its group's band
// (kit/starter/songStyle.ts: a music box doubled by a flute over soft strings, no drums) (here with a bell lead), an
// A and a B section played ABAB, 32 bars before it loops. It plays on the title, the menu, the levels and the
// endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('story', {
    bpm: 100,
    lead: 'bell',
    A: {
      chords: 'A | D | A | E | F#m | D | B | E',
      tune: 'E5 q, A5 q, C#6 q, B5 q | A5 q, F#5 q, D5 h | C#5 e, E5 e, A5 e, C#6 e, E6 q, C#6 q | B5 h., r q | A5 q, C#6 q, F#6 q, E6 q | D6 q, A5 q, F#5 h | D#5 q, F#5 q, B5 q, D#6 q | E6 h, B5 h',
    },
    B: {
      chords: 'D | A | D | E | C#m | F#m | D E | A',
      tune: 'F#5 q., A5 e, D6 h | C#6 q., B5 e, A5 h | F#5 e, A5 e, D6 e, F#6 e, E6 q, D6 q | B5 w | G#5 q, C#6 q, E6 q, C#6 q | A5 q, C#6 q, F#6 h | F#6 q, D6 q, E6 q, B5 q | A5 w',
    },
  });
}
