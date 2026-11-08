// KEYS AND DOORS's one song, "Turn the Key" in A minor, played by its group's band (kit/starter/songStyle.ts: piano
// over an oom-pah pluck and a light kick): its first eight bars are section A, with a B section added, played AABA,
// 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('basics', {
    bpm: 120,
    A: {
      chords: 'Am | Dm | E | Am | Am | Dm | E | Am',
      tune: 'A4 e, C5 e, E5 q, E5 e, D5 e, C5 q | D5 e, F5 e, A5 q, A5 e, G5 e, F5 q | E5 e, G5 e, B5 q, B5 e, A5 e, G5 q | A5 q, E5 q, A4 h | C5 e, E5 e, A5 q, A5 e, G5 e, E5 q | D5 e, F5 e, A5 q, G5 e, F5 e, D5 q | E5 q, G5 q, E5 q, D5 q | C5 q, B4 q, A4 h',
    },
    B: {
      chords: 'F | G | C | Am | Dm | E | Am | E',
      tune: 'A5 q., G5 e, F5 q, C5 q | D5 q., E5 e, G5 h | E5 e, G5 e, C6 e, G5 e, E5 q, G5 q | A5 h, E5 h | F5 q, A5 q, D6 q, A5 q | G#5 q, B5 q, E6 h | C6 q, B5 q, A5 q, E5 q | G#5 h, B4 h',
    },
  });
}
