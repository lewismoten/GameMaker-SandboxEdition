// Level 10, the Bottling Line: the WORKS in green glass. The only way out of the cloakroom is
// onto the line itself, a belt that carries Doc Leo the length of the room under three cappers
// flicking bottle caps. Coming back is another belt, the other way, and the bottom hall has a
// stretch of greased boards that only go east (they look like boards).
import type { RoomSpec } from '../room';

export const L10: RoomSpec = {
  file: 'bottling',
  level: 10,
  name: 'The Bottling Line',
  style: 'works',
  theme: 'bottling',
  ingredient: 10,
  song: 'bottling',
  card: ['Ride the line.', 'Duck the caps.', 'Some boards are greased.'],
  signs: { Q: 'signFizz' },
  born: { s: { kind: 'flyingCap', reach: 1, speed: 2 } },
  rows: [
    '##################################',
    '#Z@..#....._....._....._....#....#',
    '#....>EEEEEEEEEEEEEEEEEEEEEC#..k.#',
    '#.T..#####################.##....#',
    '####QQ######.............$......##',
    '#.#$......K#.###############.....#',
    '#.#.......K#.#WWWWWWWWWWWWWWWWWW.#',
    '#.#....#####.#.###################',
    '#......................H#........#',
    '#....,.....eeeeeee#.....L....I...#',
    '##################################',
  ],
};
