// Level 6: THE SCIENCE FAIR at Neil Armstrong Moon School. Artificial gravity, a gym
// full of erupting volcanoes, and Sparky, zooming laps with the cover page in his mouth.
// Zap him three times to calm him down, turn in 20 pages at the judges' table, hand
// over the cover page, and step up to the podium. Two signs by the door say how: zap Sparky
// for the cover, and wait at the copier (it prints a page every few seconds) if you came
// short. Beside the copier is one spare cover, for a cover a stray zap burned. Among the
// projects: a 6502 breadboard computer, the 1802 that flew to Jupiter, and a time capsule
// for America's 250th in 2026.
import { LevelMap, type Legend } from './mapkit';
import type { BlockSet } from '../blocks/book';
import { MON } from '../ids';

const LEGEND: Legend = {
  S: 'schoolTop',
  w: 'schoolWall',
  L: 'lockers',
  H: 'bleachers',
  '.': 'gym',
  '-': 'gymLine',
  V: 'volcano',
  R: 'robotproj',
  T: 'tvproj',
  O: 'potato',
  P: 'phoneproj',
  c: 'proj6502',
  g: 'proj1802',
  u: 'capsule',
  J: 'judgetable',
  K: 'covertable',
  W: { tile: 'podium', mark: 'exit' },
  B: { big: 'banner', w: 8, h: 1 },
  p: 'page_gym',
  '*': 'pill_gym',
  z: 'battery_gym',
  q: 'quarter_gym',
  s: { mon: MON.sparky },
  A: { big: 'bbSparky', w: 5, h: 2 },
  Y: { big: 'bbCopier', w: 5, h: 2 },
  C: 'copier',
  y: 'copiertray',
  x: 'sparecover',
  '@': { mark: 'start' },
};

const gym = (s: string) => {
  if (s.length !== 28) throw new Error(`Gym row is ${s.length}: ${s}`);
  return `S${s}S`;
};

const ROWS = [
  'S'.repeat(30), // 0
  `S${'w'.repeat(9)}BBBBBBBB${'w'.repeat(11)}S`, // 1
  `S${'L'.repeat(12)}.W.${'L'.repeat(13)}S`, // 2
  `S${'L'.repeat(13)}K${'L'.repeat(14)}S`, // 3
  `S${'H'.repeat(13)}J${'H'.repeat(14)}S`, // 4
  gym('............................'), // 5
  gym('..V..R..T..c....V..R..T..P..'), // 6
  gym('.p....................z.....'), // 7
  gym('............................'), // 8
  gym('...g..V.............V..T....'), // 9
  gym('.............s..............'), // 10
  gym('.*......................p...'), // 11
  gym('..T..R..V..O....u..V..R.....'), // 12
  gym('----------------------------'), // 13
  gym('....z.......p.........*.....'), // 14
  gym('..V.....T..........R...V....'), // 15
  gym('....AAAAA..q......YYYYY.....'), // 16
  gym('..p.AAAAA.........YYYYY.q...'), // 17
  gym('.....*..........z...Cx......'), // 18
  gym('....................y.......'), // 19
  gym('.............@..............'), // 20
  'S'.repeat(30), // 21
];

export function level6(set: BlockSet): LevelMap {
  const m = new LevelMap(set, 'space');
  m.stamp(0, 0, ROWS, LEGEND, 'gym');
  return m;
}
