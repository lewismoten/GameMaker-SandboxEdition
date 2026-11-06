// UNDER THE SURFACE's one song, "Pick Me": a swing tune in C major in its group's band (kit/starter/songStyle.ts: a
// lead over a walking bass, electric piano on the off-beats and a shuffle) (here with a singing lead), an A and a B
// section played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('hero', {
    bpm: 124,
    lead: 'voice',
    A: {
      chords: 'C | Am | Dm | G | C | Am | F G | C',
      tune: 'G5 e., E5 s, G5 e., A5 s, G5 q, E5 q | A5 e., C6 s, E6 q, C6 h | D6 e., C6 s, A5 e., F5 s, D5 q, F5 q | G5 h., r q | G5 e., E5 s, G5 e., A5 s, C6 q, E6 q | D6 e., C6 s, A5 e., E5 s, A5 h | F5 e., A5 s, C6 e., A5 s, G5 e., B5 s, D6 e., B5 s | C6 h., r q',
    },
    B: {
      chords: 'F | C | F | G | Em | Am | D7 | G',
      tune: 'A5 q, C6 q, F6 e., E6 s, D6 q | C6 h, G5 h | A5 e., Bb5 s, C6 e., D6 s, F6 q, C6 q | D6 w | E6 e., D6 s, B5 e., G5 s, E5 q, G5 q | A5 e., C6 s, E6 e., C6 s, A5 h | F#5 q, A5 q, C6 q, F#6 q | D6 h, B5 h',
    },
  });
}
