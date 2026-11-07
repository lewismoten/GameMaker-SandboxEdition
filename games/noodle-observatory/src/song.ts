// THE NOODLE OBSERVATORY's four songs, written for this game and played by the kit's arranger
// (kit/starter/songStyle.ts).
//   theme    "Cupboard Astronomy": a curious, tiptoeing tune in F for the title and the kitchen at dusk
//   orbit    "Uphill, Of Course": a rolling tune in G for the pantry and the rooftop chase
//   glass    "Sharper, Stranger": a quiet, glassy tune in A minor for the lens room and the dark loft
//   supper   "Next Door's Moon": a cheerful kitchen melody in C for the supper, the reveal and the ending
import { starterSong } from '../../kit/starter/songStyle';

export const SONGS = ['theme', 'orbit', 'glass', 'supper'] as const;
export type SongName = (typeof SONGS)[number];

const theme = () =>
  starterSong('story', {
    bpm: 100,
    A: {
      chords: 'F | Dm | Bb | C | F | Am | Bb C | F',
      tune: 'C5 e, F5 e, A5 q, C6 q, A5 q | D6 q, A5 q, F5 h | D5 q, F5 q, Bb5 q, D6 q | C6 h, G5 h | A5 e, C6 e, F6 q, E6 q, C6 q | E6 q, C6 q, A5 h | Bb5 q, D6 q, C6 q, E6 q | F6 h., r q',
    },
    B: {
      chords: 'Bb | F | Gm | C | Bb | F | Gm C | F',
      tune: 'D6 q, Bb5 q, F5 h | A5 q, C6 q, F6 h | G5 q, Bb5 q, D6 q, Bb5 q | C6 h, E5 h | F5 q, Bb5 q, D6 q, F6 q | E6 q, C6 q, A5 h | G5 q, Bb5 q, E6 q, G6 q | F6 w',
    },
  });

const orbit = () =>
  starterSong('moving', {
    bpm: 138,
    A: {
      chords: 'G | Em | C | D | G | Em | C D | G',
      tune: 'D5 e, G5 e, B5 q, D6 q, B5 q | E6 q, B5 q, G5 h | C6 e, E6 e, G6 q, E6 q, C6 q | A5 h, F#5 h | G5 e, B5 e, D6 q, G6 q, D6 q | B5 q, G5 q, E5 h | E5 q, G5 q, A5 q, C6 q | B5 h., r q',
    },
    B: {
      chords: 'C | G | Am | D | C | G | Am D | G',
      tune: 'E6 q, C6 q, G5 q, C6 q | D6 q, B5 q, G5 h | A5 q, C6 q, E6 q, C6 q | D6 h, A5 h | G6 q, E6 q, C6 q, E6 q | D6 q, B5 q, G5 h | A5 q, C6 q, F#6 q, A6 q | G6 w',
    },
  });

const glass = () =>
  starterSong('story', {
    bpm: 80,
    A: {
      chords: 'Am | F | C | G | Am | Dm | E | Am',
      tune: 'E6 q, C6 q, A5 h | F5 q, A5 q, C6 h | E6 q, G6 q, E6 q, C6 q | D6 h., r q | C6 q, E6 q, A6 h | F6 q, D6 q, A5 h | G#5 q, B5 q, E6 q, D6 q | C6 h., r q',
    },
    B: {
      chords: 'F | C | Dm | Am | F | C | Dm E | Am',
      tune: 'A5 h, C6 q, F6 q | E6 h, C6 h | D6 q, F6 q, A6 q, F6 q | E6 w | A6 q, F6 q, C6 q, A5 q | G5 q, C6 q, E6 h | F6 q, D6 q, B5 q, G#5 q | A5 w',
    },
  });

const supper = () =>
  starterSong('together', {
    bpm: 116,
    A: {
      chords: 'C | Am | F | G | C | Am | F G | C',
      tune: 'G5 q, C6 q, E6 q, G6 q | A6 q, E6 q, C6 h | F6 q, A6 q, F6 q, C6 q | D6 h, B5 h | C6 e, E6 e, G6 q, E6 q, C6 q | E6 q, A5 q, C6 h | A5 q, C6 q, B5 q, D6 q | C6 h., r q',
    },
    B: {
      chords: 'F | G | Em | Am | F | G | Dm G | C',
      tune: 'A5 q, C6 q, F6 h | G6 q, D6 q, B5 h | E6 q, G6 q, B6 q, G6 q | A6 h, E6 h | F6 q, A6 q, C7 q, A6 q | G6 q, D6 q, B5 h | D6 q, F6 q, B5 q, D6 q | C6 w',
    },
  });

/** A song as a .CMF file. */
export function song(name: SongName): Uint8Array {
  return { theme, orbit, glass, supper }[name]();
}
