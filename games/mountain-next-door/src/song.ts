// THE MOUNTAIN MOVED NEXT DOOR's six songs, written for this game and played by the kit's arranger
// (kit/starter/songStyle.ts).
//   theme   "Good Morning, Mountain": a slow, sunny tune in D for the title, the foggy dawn and the morning
//   trail   "Blaze the Trail": a walking tune in G for the park, the stream and the crossroads
//   dusk    "Little Cloud, Where'd You Go?": a soft tune in E minor for sunset, the ridge and the tunnel
//   home    "Please Wipe Your Foothills": a warm, proud tune in C for the zigzag home, the picnic and the ending
//   mist    "Damp, But Not a Cloud's Fault": a slow, bright tune in E for the low meadow's gathering mist
//   tiptoe  "Excuse Me, Excuse Me": a sneaky, staccato tune in A minor for walking a mountain through the sleeping town
import { starterSong } from '../../kit/starter/songStyle';

export const SONGS = ['theme', 'trail', 'dusk', 'home', 'mist', 'tiptoe'] as const;
export type SongName = (typeof SONGS)[number];

const theme = () =>
  starterSong('story', {
    bpm: 96,
    A: {
      chords: 'D | G | D | A | D | Bm | G A | D',
      tune: 'F#5 q, A5 q, D6 h | B5 q, G5 q, D5 h | F#5 q, A5 q, B5 q, A5 q | E5 h., r q | F#5 q, A5 q, D6 q, F#6 q | D6 q, B5 q, F#5 h | G5 q, B5 q, A5 q, C#6 q | D6 h., r q',
    },
    B: {
      chords: 'G | D | Em | A | G | D | Em A | D',
      tune: 'B5 q, D6 q, G6 h | F#6 q, D6 q, A5 h | G5 q, B5 q, E6 q, B5 q | C#6 h, A5 h | B5 q, G5 q, D6 q, B5 q | A5 q, F#5 q, D5 h | E5 q, G5 q, C#6 q, E6 q | D6 w',
    },
  });

const trail = () =>
  starterSong('moving', {
    bpm: 132,
    A: {
      chords: 'G | C | G | D | G | Em | C D | G',
      tune: 'G5 e, A5 e, B5 q, D6 q, B5 q | C6 q, E6 q, C6 h | B5 e, A5 e, G5 q, B5 q, D6 q | A5 h, F#5 h | G5 e, B5 e, D6 q, G6 q, D6 q | E6 q, B5 q, G5 h | C6 q, E6 q, D6 q, F#6 q | G6 h., r q',
    },
    B: {
      chords: 'Em | C | G | D | Em | C | Am D | G',
      tune: 'E6 q, B5 q, G5 q, B5 q | C6 q, G5 q, E5 h | D6 e, C6 e, B5 q, G5 q, B5 q | A5 h, D5 h | E5 q, G5 q, B5 q, E6 q | E6 q, C6 q, G5 h | A5 q, C6 q, F#5 q, A5 q | G5 h, r h',
    },
  });

const dusk = () =>
  starterSong('story', {
    bpm: 84,
    A: {
      chords: 'Em | C | G | D | Em | Am | B | Em',
      tune: 'E5 q, G5 q, B5 h | C6 q, B5 q, G5 h | D5 q, G5 q, B5 q, D6 q | A5 h., r q | B5 q, G5 q, E5 h | A5 q, C6 q, E6 h | D#6 q, B5 q, F#5 q, D#5 q | E5 h., r q',
    },
    B: {
      chords: 'C | G | Am | Em | C | G | Am B | Em',
      tune: 'E6 h, G6 q, E6 q | D6 h, B5 h | C6 q, E6 q, A5 q, C6 q | B5 w | E6 q, D6 q, C6 q, G5 q | B5 q, D6 q, G5 h | A5 q, C6 q, B5 q, D#6 q | E6 w',
    },
  });

const home = () =>
  starterSong('together', {
    bpm: 112,
    A: {
      chords: 'C | F | C | G | C | Am | F G | C',
      tune: 'E5 q, G5 q, C6 q, E6 q | F6 q, C6 q, A5 h | G5 q, E5 q, C6 q, G5 q | D6 h, B5 h | E6 q, D6 q, C6 q, G5 q | A5 q, C6 q, E6 h | F6 q, E6 q, D6 q, B5 q | C6 h., r q',
    },
    B: {
      chords: 'F | C | Dm | G | F | C | Dm G | C',
      tune: 'A5 q, C6 q, F6 h | E6 q, C6 q, G5 h | F5 q, A5 q, D6 q, F6 q | D6 h, B5 h | A5 q, C6 q, F6 q, A6 q | G6 q, E6 q, C6 h | D6 q, F6 q, B5 q, D6 q | C6 w',
    },
  });

const mist = () =>
  starterSong('story', {
    bpm: 72,
    A: {
      chords: 'E | B | C#m | A | E | B | A B | E',
      tune: 'G#5 h, B5 q, E6 q | F#5 h, B5 h | E5 q, G#5 q, C#6 h | C#6 q, B5 q, A5 h | G#5 h, B5 q, E6 q | D#6 h, B5 h | C#6 q, E6 q, A5 q, D#6 q | E6 w',
    },
    B: {
      chords: 'A | E | C#m | B | A | E | A B | E',
      tune: 'A5 q, C#6 q, E6 h | G#5 q, B5 q, E6 h | E5 q, G#5 q, B5 q, C#6 q | D#6 h, F#6 h | E6 q, C#6 q, A5 h | B5 q, G#5 q, E5 h | A5 q, C#6 q, B5 q, D#6 q | E6 w',
    },
  });

const tiptoe = () =>
  starterSong('worlds', {
    bpm: 104,
    A: {
      chords: 'Am | Am | Dm | Am | E | Am | Dm E | Am',
      tune: 'A4 e, r e, C5 e, r e, E5 e, r e, C5 e, r e | A4 e, r e, C5 e, r e, E5 q, r q | D5 e, r e, F5 e, r e, A5 e, r e, F5 e, r e | E5 q, C5 q, A4 h | B4 e, r e, E5 e, r e, G#5 e, r e, E5 e, r e | A5 q, E5 q, C5 h | D5 q, F5 q, E5 q, G#5 q | A5 h., r q',
    },
    B: {
      chords: 'F | C | G | Am | F | C | Dm E | Am',
      tune: 'C5 q, A4 q, F4 h | E4 e, G4 e, C5 e, E5 e, G5 h | D5 q, B4 q, G4 h | A4 e, C5 e, E5 e, C5 e, A4 h | A4 q, C5 q, F5 q, C5 q | G4 e, C5 e, E5 e, G5 e, E5 q, C5 q | D5 q, F5 q, B4 q, D5 q | C5 w',
    },
  });

/** A song as a .CMF file. */
export function song(name: SongName): Uint8Array {
  return { theme, trail, dusk, home, mist, tiptoe }[name]();
}
