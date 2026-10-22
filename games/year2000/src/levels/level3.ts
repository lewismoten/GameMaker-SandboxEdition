// Level 3: MEGA MALL 2000. Three floors of shopping under one glass roof: the ARCADE
// (quarters buy points), TV-RAMA (five hundred channels, all of them on at once), PILLS
// food court (the whole Thanksgiving dinner in one capsule), and a hover-rink downstairs.
// The Employees Only keycard is locked in a laser display case at TV-RAMA; the loading
// dock behind the STAFF door has a Teleport-A-Phone. Security robots don't like running.
import { LevelMap, type Legend } from './mapkit';
import type { BlockSet } from '../blocks/book';
import { MON } from '../ids';

const LEGEND: Legend = {
  '#': 'mallTop',
  w: 'mallWall',
  '.': 'tile',
  ',': 'carpet',
  A: 'arcade',
  Y: 'pinTop',
  y: 'pinball',
  V: 'tv',
  F: 'fountain',
  P: 'palm',
  f: 'foodtable',
  S: 'staffdoor',
  K: 'secdock',
  l: 'laser',
  '^': 'tube_up',
  v: 'tube_down',
  G: { big: 'nArcade', w: 3, h: 1 },
  H: { big: 'nTv', w: 3, h: 1 },
  J: { big: 'nPill', w: 3, h: 1 },
  B: 'booth_top',
  b: { tile: 'booth_door', mark: 'exit' },
  n: 'booth_dead',
  r: 'booth_ring',
  p: 'page_tile',
  q: 'quarter_tile',
  '*': 'pill_tile',
  z: 'battery_tile',
  k: 'keycard_tile',
  L: 'cola_tile',
  Q: 'quarter_carpet',
  g: 'page_carpet',
  '@': { tile: 'tile', mark: 'start' },
  '1': { mon: MON.secbotPatrol },
  '2': { mon: MON.secbot },
  '3': { mon: MON.cart },
  '4': { mon: MON.cartV },
  '5': { mon: MON.shopper },
  '6': { mon: MON.skater },
  '7': { tile: 'carpet', mon: MON.shopper },
};

/** North stores: arcade (13 wide), TV-RAMA (14), food court (13). */
const north = (a: string, b: string, c: string, sep = '#') => `#${a}${sep}${b}${sep}${c}#`;
/** The concourse, 42 wide. */
const mall = (c: string) => `#${c}#`;
/** Downstairs: the rink (20 wide) and the staff area (21 wide). */
const south = (w: string, e: string) => `#${w}#${e}#`;

const ROWS = [
  '#'.repeat(44), // 0
  north('AAAA,,,,,AAAA', 'VVVVVVVVVVVVVV', '.............'), // 1
  north(',,,,,,g,,,,,,', '.p.........V.k', '.f.f.f.f.f.f.'), // 2
  north('Y,,Y,,,,,Y,,Y', '...........V..', '.............'), // 3
  north('y,,y,,Q,,y,,y', '.VVV..VVV..Vll', '.f.f.*.f.f.f.'), // 4
  north(',,,,,,,,,,,,,', '..1...........', '....5........'), // 5
  north(',Q,,AA,,AA,,,', '.VVV..VVV.....', '.f.f.f.f.f.f.'), // 6
  north(',,,,,,,,,,,Q,', '..........q...', '.......p.....'), // 7
  north(',g,,,,7,,,,,,', '.VVV..VVV..VVV', '.f.f.f.f.f.f.'), // 8
  north(',,,,,,,,,,,,,', '..............', '...q.....z...'), // 9
  north('wGGGww...wwww', 'wwHHHww..wwwww', 'wwJJJww..wwww', 'w'), // 10
  mall('..........................................'), // 11
  mall('.P....p.......P......4P...........P.....q.'), // 12
  mall('..........3...............................'), // 13
  mall('...............FF..........5..............'), // 14
  mall('@q.............FF...................2.....'), // 15
  mall('.......5..................................'), // 16
  mall('..p........K..............K...............'), // 17
  mall('.P...............L..........P........*..P.'), // 18
  mall('.........................p................'), // 19
  mall('..........................................'), // 20
  mall('wwwwvvww^^wwwwwwwwwwwwwwwwwwwwwSwwwwwwwwww'), // 21
  south('####vv##^^##########', '.....................'), // 22
  south('####vv##^^##########', 'lllllllllllllllllllll'), // 23
  south('....p.......6.......', '...p.......1.........'), // 24
  south('.q................q.', '.....................'), // 25
  south('........6...........', 'lllllllllllllllllllll'), // 26
  south('....................', '...z.........q.......'), // 27
  south('...p.........6....p.', '.....................'), // 28
  south('.........q..........', 'lllllllllllllllllllll'), // 29
  south('..L........*........', '..................B..'), // 30
  south('....................', '.....*............b..'), // 31
  '#'.repeat(44), // 32
];

export function level3(set: BlockSet): LevelMap {
  const m = new LevelMap(set, 'void');
  m.stamp(0, 0, ROWS, LEGEND, 'tile');
  return m;
}
