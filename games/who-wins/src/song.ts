// WHO WINS?'s one song, "Face Off": a driving minor tune in G minor in its group's band (kit/starter/songStyle.ts: a
// lead doubled an octave down, a pumping bass, strings and a stomping beat) (here with a square-wave lead), an A and
// a B section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('foes', {
    bpm: 140,
    lead: 'square',
    A: {
      chords: 'Gm | Eb | F | D | Gm | Eb | Cm | D',
      tune: 'G5 e, Bb5 e, D6 q, Bb5 e, G5 e, D5 q | Eb5 e, G5 e, Bb5 q, G5 e, Eb5 e, Bb4 q | F5 e, A5 e, C6 q, A5 e, F5 e, C5 q | D5 q, F#5 q, A5 h | G5 e, Bb5 e, D6 q, G6 q, D6 q | Eb6 e, D6 e, C6 e, Bb5 e, G5 h | C6 e, Bb5 e, G5 e, Eb5 e, C5 q, Eb5 q | D5 h., r q',
    },
    B: {
      chords: 'Cm | Gm | Cm | D | Eb | Bb | Cm D | Gm',
      tune: 'C6 q, Eb6 q, C6 q, G5 q | Bb5 q, D6 q, Bb5 q, G5 q | C6 e, D6 e, Eb6 e, F6 e, G6 q, Eb6 q | F#6 w | G6 q, Eb6 q, Bb5 q, G5 q | F5 q, D6 q, Bb5 h | Eb6 e, C6 e, G5 e, C6 e, D6 e, A5 e, F#5 e, A5 e | G5 h., r q',
    },
  });
}
