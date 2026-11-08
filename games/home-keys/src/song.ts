// HOME KEYS's one song, "Home Row Hop": a swing tune in G major in its group's band (kit/starter/songStyle.ts: a lead
// over a walking bass, electric piano on the off-beats and a shuffle) (here with a brass lead), an A and a B section
// played AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('hero', {
    bpm: 122,
    lead: 'brass',
    A: {
      chords: 'G | G | C | G | Am | D | G | D',
      tune: 'B4 q, D5 e., B4 s, G5 q, D5 q | E5 e., D5 s, B4 e., G4 s, D5 h | E5 q, G5 e., E5 s, C6 q, G5 q | B5 e., A5 s, G5 e., D5 s, B4 h | C5 q, E5 e., A5 s, C6 q, A5 q | F#5 e., A5 s, D6 e., C6 s, A5 h | B5 q, G5 q, D5 q, B4 q | A4 h., r q',
    },
    B: {
      chords: 'C | C | G | G | A7 | A7 | D | D7',
      tune: 'E5 e., G5 s, C6 h, B5 q | A5 e., G5 s, E5 e., C5 s, E5 h | D5 e., G5 s, B5 h, A5 q | G5 e., D5 s, B4 e., G4 s, B4 h | C#5 e., E5 s, A5 h, G5 q | E5 e., C#5 s, A4 e., C#5 s, E5 h | F#5 q, A5 q, D6 q, A5 q | C6 h, F#5 h',
    },
  });
}
