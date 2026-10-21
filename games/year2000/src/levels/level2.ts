// Level 2: THE INFORMATION SUPERHIGHWAY. Everybody said it was coming, and here it is:
// fourteen lanes of hover traffic hauling faxes and encyclopedias through the clouds.
// Cross the lanes island by island (Frogger never had it this good), ride the pneumatic
// tube, and catch the Teleport-A-Phone on the far platform to the Mega Mall. The news
// zipper on the north rail is one animation chain laid at twelve different phases.
import { LevelMap, type Legend } from './mapkit';
import type { BlockSet } from '../blocks/book';
import { MON } from '../ids';
import { tickerSquare } from '../blocks/ticker';

const LEGEND: Legend = {
  '~': 'clouds',
  '^': 'clouds2',
  _: 'deck',
  '-': 'lane',
  '=': 'laneLine',
  R: 'railH',
  V: 'railV',
  o: 'railPost',
  '>': 'tube_right',
  '<': 'tube_left',
  a: 'tunnelR',
  b: 'tunnelL',
  c: 'tunnelFR',
  d: 'tunnelFL',
  e: 'tunnelTR',
  f: 'tunnelTL',
  g: 'tunnelCR',
  T: 'tollbot',
  P: 'pillstand',
  Q: 'pillstand2',
  B: 'booth_top',
  n: 'booth_dead',
  x: { tile: 'booth_door', mark: 'exit' },
  p: 'page_deck',
  q: 'quarter_deck',
  '*': 'pill_deck',
  z: 'battery_deck',
  L: 'cola_deck',
  I: { big: 'bbInfo', w: 3, h: 2 },
  X: { big: 'bbFax', w: 3, h: 2 },
  '@': { tile: 'deck', mark: 'start' },
  '1': { mon: MON.faxbot },
  '2': { mon: MON.skater },
  '3': { mon: MON.alien2 },
};

/** A platform or island row: rails at both ends, 28 blocks of deck between. */
const plat = (c: string, l = 'V', r = 'V') => `~${l}${c}${r}~`;
/** A lane of traffic, 30 blocks, with a tunnel at one end (or clouds). */
const lane = (left: string, right: string, line = false) => `${left}${(line ? '=' : '-').repeat(30)}${right}`;

const ROWS = [
  '~~~^~~~~~~~~~~~~~~~~~~~^~~~~~~~~', // 0
  plat('R'.repeat(28), 'o', 'o'), // 1
  plat('__III__B____q_________p_____'), // 2
  plat('__III_@n______3_____________'), // 3
  plat('_z______*____________q______'), // 4
  plat('____________________________'), // 5
  lane('a', '~', true), // 6
  lane('~', 'b'), // 7
  lane('c', '~'), // 8
  lane('~', 'f'), // 9
  plat('_____p____PQ______1____q____'), // 10
  plat('__q___________T________p____'), // 11
  lane('e', '~', true), // 12
  lane('~', 'd'), // 13
  lane('g', '~'), // 14
  lane('~', 'b'), // 15
  lane('c', '~'), // 16
  plat('__*_______q_______________p_'), // 17
  plat('>'.repeat(25) + '___'), // 18
  plat('__p___2_____________1__q__L_'), // 19
  lane('~', 'f', true), // 20
  lane('a', '~'), // 21
  lane('~', 'd'), // 22
  lane('c', '~'), // 23
  lane('~', 'b'), // 24
  plat('_q______________________B___'), // 25
  plat('__XXX______p_____T______x___'), // 26
  plat('__XXX___z_______1___________'), // 27
  plat('R'.repeat(28), 'o', 'o'), // 28
  '~~~~~~~^~~~~~~~~~~~~~~^~~~~~~~~~', // 29
];

export function level2(set: BlockSet): LevelMap {
  const m = new LevelMap(set, 'clouds');
  // Clouds all around, with a few lighter puffs.
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if ((x * 7 + y * 13) % 11 === 0) m.set_(x, y, 'clouds2');
  m.stamp(0, 0, ROWS, LEGEND, 'deck');
  // The Skyway News Feed scrolls along the north rail.
  for (let i = 0; i < 12; i++) m.set_(9 + i, 1, tickerSquare(i));
  return m;
}
