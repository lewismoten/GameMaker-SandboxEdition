// The finale's themes, all in one place so every song takes them from here: Teddy's Theme
// (shared by the whole series, games/kit/teddyTheme.ts), Gwinn's Theme (from the sequel),
// and two new ones, Doc Leo's soft-shoe and THE CHEZ's Road Song. "Happy Birthday to You" is
// the tune of "Good Morning to All" by Mildred J. Hill (1893), in the public domain.
export { THEME_A, THEME_B, THEME_CHORDS } from '../../../kit/teddyTheme';

/** Gwinn's Theme: 8 bars in A minor, all elbows (the sequel's). */
export const GWINN_A = 'A4 e, C5 e, E5 e, A5 e, G5 q, E5 q, F5 e, E5 e, D5 e, F5 e, E5 h, A4 e, C5 e, E5 e, A5 e, B5 q, G#5 q, A5 q, E5 q, A4 h';
export const GWINN_B = 'D5 q, F5 e, A5 e, D6 q, A5 q, C6 e, B5 e, A5 e, G5 e, A5 h, F5 q, E5 e, D5 e, E5 q, G#5 q, A5 h., r q';
export const GWINN_CHORDS = ['Am', 'Dm', 'Am', 'E7', 'Dm', 'Am', 'E7', 'Am'];

/** Doc Leo's Theme: a soft-shoe in F, 8 bars, an easy stroll with a tip of the hat. */
export const LEO_A = 'C5 q., A4 e, F4 q, A4 q, Bb4 e, A4 e, G4 e, A4 e, C5 h, D5 q., C5 e, Bb4 q, G4 q, A4 e, G4 e, F4 e, G4 e, A4 h';
export const LEO_B = 'F5 q., E5 e, D5 q, C5 q, Bb4 e, C5 e, D5 e, Bb4 e, G4 h, A4 q., Bb4 e, C5 q, F5 q, E5 e, D5 e, C5 e, E5 e, F5 h';
export const LEO_CHORDS = ['F', 'C7', 'Gm', 'F', 'Dm', 'Gm', 'F', 'C7'];

/** THE CHEZ's Road Song: 8 bars in G, humming along at a CitiCar's top speed. */
export const ROAD_A = 'G4 e, B4 e, D5 e, G5 e, F#5 q, D5 q, E5 e, D5 e, B4 e, G4 e, A4 h, C5 e, E5 e, G5 e, E5 e, D5 q, B4 q, A4 e, B4 e, C5 e, A4 e, G4 h';
export const ROAD_B = 'B4 q, D5 q, G5 q, D5 q, C5 q, E5 q, A5 h, B5 e, A5 e, G5 e, F#5 e, E5 q, D5 q, C5 e, B4 e, A4 e, B4 e, G4 h';
export const ROAD_CHORDS = ['G', 'D7', 'C', 'G', 'G', 'Am', 'Em', 'G'];

/** "Happy Birthday to You" (public domain), 9 bars of 3/4 in C, the first one a pickup. */
export const BIRTHDAY =
  'r h, G4 e., G4 s, A4 q, G4 q, C5 q, B4 h, G4 e., G4 s, A4 q, G4 q, D5 q, C5 h, G4 e., G4 s, G5 q, E5 q, C5 q, B4 q, A4 q, F5 e., F5 s, E5 q, C5 q, D5 q, C5 h.';
export const BIRTHDAY_CHORDS = ['C', 'C', 'G7', 'G7', 'C', 'C7', 'F', 'G7', 'C'];
