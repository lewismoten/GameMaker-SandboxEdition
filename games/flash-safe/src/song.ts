// FLASH SAFE's one song, "Gentle Glow": a clockwork tune in F major in its group's band (kit/starter/songStyle.ts:
// piano with a bell above, a walking bass, a pluck on every off-beat and a ticking hat), an A and a B section played
// AABA, 32 bars before it loops. It plays on the title, the menu, the levels and the endings.
import { starterSong } from '../../kit/starter/songStyle';

/** The song as a .CMF file. */
export function song(): Uint8Array {
  return starterSong('together', {
    bpm: 116,
    A: {
      chords: 'F | C | Dm | Bb | F | C | Bb | C',
      tune: 'A5 q, G5 e, F5 e, C5 q, F5 q | G5 q, E5 e, C5 e, G4 h | A4 e, D5 e, F5 e, A5 e, D6 q, A5 q | Bb5 h, F5 h | C6 q, A5 e, F5 e, C6 q, F6 q | E6 q, C6 e, G5 e, E5 h | D5 e, F5 e, Bb5 e, D6 e, C6 q, Bb5 q | G5 h., r q',
    },
    B: {
      chords: 'Bb | F | Gm | Dm | Bb | F | Gm | C',
      tune: 'D6 h, F6 q, D6 q | C6 h, A5 q, F5 q | G5 e, Bb5 e, D6 e, Bb5 e, G5 q, D5 q | F5 h, A5 h | Bb5 q, D6 q, F6 q, Bb5 q | A5 q, C6 q, F6 h | G5 q, Bb5 q, A5 q, G5 q | E5 h., r q',
    },
  });
}
