// Which file slots of a start or end scene hold its between-scene screens and songs
// (GAMECLAS.H: a start scene's title, menu, storyline... screens; an end scene's won and
// lost screens), named for the integrator's side panel and its cards.
import { sceneKind, type Game } from '../../../formats/game';

/** Between-scene screens, by scene kind and slot. */
const START_SCREENS: [number, string][] = [
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
const END_SCREENS: [number, string][] = [
  [0, 'Game won'],
  [2, 'Game lost'],
];
const END_SONGS: [number, string][] = [
  [1, 'Game won song'],
  [3, 'Game lost song'],
];

/** A screen or song a scene uses, for the integrator's side panel. */
export interface SideEntry {
  /** "Title", "Game won song", "Level 3 intro"… */
  label: string;
  file: string;
  scene: number;
}

/** Every between-scene screen and song the game names, scene by scene (a level's intro and exit pictures and its song too). */
export function screensAndSongs(game: Game): { screens: SideEntry[]; songs: SideEntry[] } {
  const screens: SideEntry[] = [];
  const songs: SideEntry[] = [];
  game.scenes.forEach((s, i) => {
    const kind = sceneKind(s);
    const add = (list: SideEntry[], slots: [number, string][], prefix = '') => {
      for (const [slot, label] of slots) if (s.files[slot]) list.push({ label: prefix + label, file: s.files[slot], scene: i });
    };
    if (kind === 'start') (add(screens, START_SCREENS), add(songs, START_SONGS));
    else if (kind === 'end') (add(screens, END_SCREENS), add(songs, END_SONGS));
    else if (kind === 'adventure') {
      const name = s.desc || `Level ${i}`;
      add(
        screens,
        [
          [9, ' intro'],
          [10, ' exit'],
        ],
        name,
      );
      add(songs, [[8, '']], name);
    }
  });
  return { screens, songs };
}
