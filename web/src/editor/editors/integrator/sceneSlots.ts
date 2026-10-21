// Which file slots of a start or end scene hold its between-scene screens and songs
// (GAMECLAS.H: a start scene's title, menu, storyline... screens; an end scene's won and
// lost screens), named for the integrator's side panel and its cards.
/** Between-scene screens, by scene kind and slot. */
export const START_SCREENS: [number, string][] = [
  [0, 'Title'],
  [2, 'Menu'],
  [4, 'Storyline'],
  [6, 'Instructions'],
  [7, 'Credits'],
  [8, 'High scores'],
  [9, 'Load game'],
  [10, 'Save game'],
];
export const START_SONGS: [number, string][] = [
  [1, 'Title song'],
  [3, 'Menu song'],
  [5, 'Storyline song'],
];
export const END_SCREENS: [number, string][] = [
  [0, 'Game won'],
  [2, 'Game lost'],
];
export const END_SONGS: [number, string][] = [
  [1, 'Game won song'],
  [3, 'Game lost song'],
];
