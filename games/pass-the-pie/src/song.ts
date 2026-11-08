// PASS THE PIE's three songs (starterSong, the Starters' band): "Street Walk" (swing, G major) for Rory's storybook
// streets, "Payback" (brass over a driving beat, E minor, 160) for Mr. Plume's, and "Long Table" (a music box,
// F major) for the ending.
import { starterSong } from '../../kit/starter/songStyle';

export const streetWalk = (): Uint8Array =>
  starterSong('hero', {
    bpm: 112,
    A: {
      chords: 'G | Em | C | D | G | Em | Am D | G',
      tune: 'G4 q, B4 q, D5 q, G5 q | E5 h, B4 h | C5 e, D5 e, E5 e, G5 e, E5 q, C5 q | D5 h., r q | B4 q, D5 q, G5 q, B5 q | G5 e, F#5 e, E5 e, D5 e, B4 h | A4 q, C5 q, E5 q, D5 q | G5 h., r q',
    },
    B: {
      chords: 'C | G | C | D | Em | Bm | C D | G',
      tune: 'E5 q, C5 q, G5 q, E5 q | D5 q, B4 q, G4 h | C5 e, D5 e, E5 e, F#5 e, G5 q, C6 q | A5 w | B5 q, G5 q, E5 q, B4 q | D5 q, F#5 q, B5 h | C6 e, B5 e, A5 e, G5 e, F#5 q, A5 q | G5 h., r q',
    },
  });

export const payback = (): Uint8Array =>
  starterSong('foes', {
    bpm: 160,
    lead: 'brass',
    A: {
      chords: 'Em | Em | C | D | Em | Em | C B | Em',
      tune: 'E5 e, E5 e, G5 e, E5 e, B5 q, A5 q | G5 e, F#5 e, E5 e, D5 e, E5 h | C6 q, B5 q, G5 q, E5 q | D5 e, E5 e, F#5 e, A5 e, D6 h | E5 e, E5 e, G5 e, E5 e, B5 q, E6 q | D6 e, B5 e, G5 e, B5 e, E6 h | C6 q, G5 q, B5 q, D#6 q | E6 h., r q',
    },
    B: {
      chords: 'Am | Em | Am | B | C | G | Am B | Em',
      tune: 'A5 q, C6 q, E6 q, C6 q | B5 e, A5 e, G5 e, B5 e, E5 h | A5 e, B5 e, C6 e, E6 e, A6 h | F#6 q, D#6 q, B5 h | G6 e, E6 e, C6 e, E6 e, G6 q, E6 q | D6 e, B5 e, G5 e, B5 e, D6 h | C6 q, A5 q, B5 q, D#6 q | E6 w',
    },
  });

export const longTable = (): Uint8Array =>
  starterSong('story', {
    bpm: 84,
    A: {
      chords: 'F | Dm | Bb | C | F | Am | Bb C | F',
      tune: 'A5 h, C6 h | D6 q, C6 q, A5 h | Bb5 h, D6 h | C6 w | A5 q, C6 q, F6 h | E6 h, C6 h | D6 q, Bb5 q, C6 h | A5 h., r q',
    },
    B: {
      chords: 'Bb | F | Gm | C | F | Dm | Bb C | F',
      tune: 'D6 h, F6 h | C6 q, A5 q, F5 h | D6 q, Bb5 q, G5 h | E5 w | A5 q, C6 q, F6 q, A6 q | F6 h, D6 h | D6 q, C6 q, Bb5 q, G5 q | F5 w',
    },
  });
