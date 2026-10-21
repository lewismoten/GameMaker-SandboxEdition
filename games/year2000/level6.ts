// Level 6: THE SCIENCE FAIR at Neil Armstrong Moon School. Artificial gravity, a gym
// full of erupting volcanoes, and Sparky, zooming laps with the cover page in his mouth.
// Zap him three times to calm him down, turn in 20 pages at the judges' table, hand
// over the cover page, and step up to the podium.
import { LevelMap, type Legend } from './mapkit';
import type { BlockSet } from './src/blocks/book';
import { MON } from './src/ids';

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
  J: 'judgetable',
  K: 'covertable',
  W: { tile: 'podium', mark: 'exit' },
  B: { big: 'banner', w: 8, h: 1 },
  p: 'page_gym',
  '*': 'pill_gym',
  z: 'battery_gym',
  q: 'quarter_gym',
  s: { mon: MON.sparky },
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
  gym('..V..R..T..O....V..R..T..P..'), // 6
  gym('.p....................z.....'), // 7
  gym('............................'), // 8
  gym('...O..V.............V..T....'), // 9
  gym('.............s..............'), // 10
  gym('.*......................p...'), // 11
  gym('..T..R..V..O....O..V..R.....'), // 12
  gym('----------------------------'), // 13
  gym('....z.......p.........*.....'), // 14
  gym('..V.....T..........R...V....'), // 15
  gym('...........q................'), // 16
  gym('..p.....................q...'), // 17
  gym('.....*..........z...........'), // 18
  gym('............................'), // 19
  gym('.............@..............'), // 20
  'S'.repeat(30), // 21
];

export function level6(set: BlockSet): LevelMap {
  const m = new LevelMap(set, 'space');
  m.stamp(0, 0, ROWS, LEGEND, 'gym');
  return m;
}
