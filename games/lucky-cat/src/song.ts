// LUCKY CAT's four songs, all written for this game and played by the kit's arranger (kit/starter/songStyle.ts).
//   theme   "Lucky Streak": a sunny march in C for the title, the menu and the street levels
//   mirror  "Left Is Right": a sneaky little tune in A minor for the mirror maze
//   fair    "Thirteen Chimes": a running tune in D for the race to the fair
//   finale  "Official Mascot": a proud, warm tune in G for the last level and the ending
import { starterSong } from '../../kit/starter/songStyle';

export const SONGS = ['theme', 'mirror', 'fair', 'finale'] as const;
export type SongName = (typeof SONGS)[number];

const theme = () =>
  starterSong('basics', {
    bpm: 120,
    A: {
      chords: 'C | F | C | G | C | Am | F G | C',
      tune: 'E5 q, G5 q, C6 q, G5 q | A5 q, C6 q, A5 q, F5 q | E5 q, G5 q, E6 h | D6 q, B5 q, G5 h | E5 q, G5 q, C6 q, E6 q | C6 q, A5 q, E5 h | F5 q, A5 q, G5 q, B5 q | C6 h., r q',
    },
    B: {
      chords: 'F | C | G | C | F | C G | Am | G',
      tune: 'A5 q, C6 q, F6 q, C6 q | G5 q, E5 q, C5 h | D5 q, G5 q, B5 q, D6 q | C6 w | A5 q, C6 q, A5 e, G5 e, F5 q | E5 q, G5 q, D5 q, B4 q | C6 e, B5 e, A5 e, G5 e, A5 h | G5 h, r h',
    },
  });

const mirror = () =>
  starterSong('story', {
    bpm: 108,
    A: {
      chords: 'Am | Dm | Am | E | Am | F | Dm E | Am',
      tune: 'A4 q, C5 q, E5 q, A5 q | F5 q, A5 q, D5 h | E5 q, C5 q, A4 h | G#4 q, B4 q, E5 h | A4 q, C5 q, E5 q, A5 q | A5 q, F5 q, C5 h | D5 q, F5 q, E5 q, G#5 q | A5 h., r q',
    },
    B: {
      chords: 'C | G | Am | E | F | C | Dm | E',
      tune: 'E5 q, G5 q, C6 q, G5 q | D5 q, G5 q, B5 h | C5 q, E5 q, A5 h | B4 q, E5 q, G#5 h | F5 q, A5 q, C6 q, A5 q | G5 q, E5 q, C5 h | D5 q, F5 q, A5 q, D6 q | E5 h, r h',
    },
  });

const fair = () =>
  starterSong('moving', {
    bpm: 150,
    A: {
      chords: 'D | A | D | G | D | Bm | G A | D',
      tune: 'D5 e, F#5 e, A5 e, F#5 e, D6 q, A5 q | E5 e, A5 e, C#6 e, A5 e, E6 q, C#6 q | D5 e, F#5 e, A5 e, F#5 e, D6 q, F#6 q | G5 q, B5 q, D6 h | F#5 e, A5 e, D6 e, A5 e, F#6 q, D6 q | D6 q, B5 q, F#5 h | G5 q, B5 q, A5 q, C#6 q | D6 h., r q',
    },
    B: {
      chords: 'Bm | F#m | G | A | Bm | G | A | D',
      tune: 'B5 e, D6 e, F#6 e, D6 e, B5 q, F#5 q | A5 e, C#6 e, F#6 e, C#6 e, A5 q, F#5 q | G5 e, B5 e, D6 e, B5 e, G6 q, D6 q | E6 e, C#6 e, A5 e, C#6 e, E6 h | D6 q, B5 q, F#5 q, B5 q | B5 q, G5 q, D5 h | C#6 q, E6 q, A5 q, C#6 q | D6 h, r h',
    },
  });

const finale = () =>
  starterSong('together', {
    bpm: 116,
    A: {
      chords: 'G | Em | C | D | G | Em | C D | G',
      tune: 'G5 q, B5 q, D6 q, B5 q | E5 q, G5 q, B5 h | C6 q, E6 q, C6 q, G5 q | A5 q, F#5 q, D5 h | G5 q, B5 q, D6 q, G6 q | E6 q, D6 q, B5 h | C6 q, B5 q, A5 q, D6 q | G5 h., r q',
    },
    B: {
      chords: 'C | G | Am | D | C | G | Em C | D',
      tune: 'E6 q, C6 q, G5 q, C6 q | D6 q, B5 q, G5 h | C6 q, A5 q, E5 q, A5 q | F#5 q, A5 q, D6 h | E6 e, D6 e, C6 e, B5 e, C6 h | B5 q, D6 q, G6 h | G6 q, E6 q, C6 q, E6 q | D6 w',
    },
  });

/** A song as a .CMF file. */
export function song(name: SongName): Uint8Array {
  return { theme, mirror, fair, finale }[name]();
}
