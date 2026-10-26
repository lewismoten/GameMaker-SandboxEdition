// Teddy's Theme, the one melody the Teddy games share (teddy, teddy2, teddy3), so every
// arrangement and the Cast page (which plays teddy's title.cmf) stay in step.
// Note strings for games/kit/music.ts, in C major, four bars each of 4/4.

/** The hook: a hop up to high C, a bark down a G7, the same hop from D, home. Over C | G7 | F (or Dm) | C. */
export const THEME_A = 'E5 e, G5 e, C6 q, A5 e, G5 e, E5 q, F5 e, D5 e, B4 e, D5 e, G5 h, D5 e, F5 e, A5 q, G5 e, F5 e, D5 q, G5 e, E5 e, D5 e, E5 e, C5 h';

/** The answer: climbs to high C and walks home. Over C | Am | Dm | G7 (or C | F | G7 | C). */
export const THEME_B = 'E5 q, E5 e, F5 e, G5 q, C6 q, B5 e, A5 e, G5 e, F5 e, E5 h, D5 q, D5 e, E5 e, F5 q, A5 q, G5 e, F5 e, E5 e, D5 e, C5 h';

/** The theme's usual chords, one per bar: THEME_A then THEME_B. */
export const THEME_CHORDS = ['C', 'G7', 'F', 'C', 'C', 'Am', 'Dm', 'G7'];
