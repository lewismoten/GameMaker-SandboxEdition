// Chapter 1, The Clock Tower. The town clock stopped at 6:59, and the Clown Club's parade starts
// when it strikes seven. The square (Doc Leo waiting, the float ready), the inside of the tower
// (wooden floors to hop up through, the escapement's bridges that tick and tock in turn, two stuck
// gears) and the belfry (the third gear, the striking hammer that needs all three, and the bell
// rope). Then the square again at seven o'clock: Doc Leo's corner, where his thank-you is, opens
// once (a rope on chapter 1's flag) and lets Joe out by a little gate that only swings outward.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

export const SQUARE_ROWS = [
  'hhhhhhhhhWWWWWhhhhhhhhhh',
  'h........WWcWW.........h',
  'h.l......WWWWW......l..h',
  'h........WWdWW.........h',
  'h......................h',
  'h..A..........FG.......h',
  'h....RL.........B......h',
  'h......................h',
  'h..n.....,,,,.....n....h',
  'h.B...........,.....A..h',
  'h....p...........p.....h',
  'h..l.......@........l..h',
  'hhhhhhhhhhhShhhhhhhhhhhh',
];

export const SQUARE7_ROWS = [
  'hhhhhhhhhWWWWWhhhhhhhhhh',
  'h........WW7WW.........h',
  'h.l......WWWWW......l..h',
  'h........WWWWW.........h',
  'h......................h',
  'h..A.FGhh.....FG.......h',
  'h...RhLkh.......B......h',
  'h....h..h..............h',
  'h..n.hJVh,,,......n....h',
  'h.B...........,.....A..h',
  'h....p...........p.....h',
  'h..l.......@........l..h',
  'hhhhhhhhhhhShhhhhhhhhhhh',
];

const SQUARE_LEGEND = {
  h: 'hedge',
  W: 'towerWall',
  c: 'clock659',
  '7': 'clock700',
  d: 'towerDoor',
  '.': 'cobble',
  ',': 'cobble2',
  l: 'lampPost',
  n: 'parkBench',
  A: 'clownA0',
  B: 'clownB0',
  F: 'float0',
  G: 'float1',
  R: 'reggie',
  L: 'leo',
  '@': 'cobble',
  S: 'cobble',
  J: 'rope',
  V: 'swing',
  k: 'windKey',
};

export function squareMap(set: BlockSet, mons: Bestiary, seven: boolean): Stamped {
  const legend: Record<string, string | { tile: string; mon?: string }> = {
    ...SQUARE_LEGEND,
    L: seven ? 'leoGlad' : 'leo',
    p: { tile: 'cobble', mon: 'pigeon' },
  };
  return stamp(seven ? SQUARE7_ROWS : SQUARE_ROWS, legend, set, 'hedge', mons, 'dL@SJk');
}

// The tower from the side: '#' brick, '.' and ':' wall, '=' wooden floor (solid on top), 'A' a
// tick bridge, 'B' a tock bridge, 'g' a stuck gear, 'w' a window, '1234' the big cog, 'D' the
// door back to the square, 'X' the hatch up, '@' where Joe comes in, 'o' and ':' the pendulum's
// rod and bob.
export const TOWER_ROWS = [
  '########################',
  '#......................#',
  '#...........w.........X#',
  '#..........============#',
  '#......................#',
  '#.....=====...12.......#',
  '#.............34.......#',
  '#.===.............o....#',
  '#.g...............:....#',
  '#=====AA===BB===AA==...#',
  '#...................==.#',
  '#......................#',
  '#...................==.#',
  '#.......w..............#',
  '#................===...#',
  '#..............g.......#',
  '#..........=========...#',
  '#......................#',
  '#.......====...........#',
  '#......................#',
  '#....====..............#',
  '#D@....................#',
  '########################',
];

export function towerMap(set: BlockSet, mons: Bestiary): Stamped {
  return stamp(
    TOWER_ROWS,
    {
      '#': 'brick',
      '.': 'air',
      '=': 'beam',
      A: 'tick',
      B: 'tockWarn',
      g: 'gear',
      w: 'airWindow',
      '1': 'cog0',
      '2': 'cog1',
      '3': 'cog2',
      '4': 'cog3',
      D: 'door',
      X: 'hatch',
      '@': 'air',
      o: { tile: 'air', mon: 'rod' },
      ':': { tile: 'air2', mon: 'bob' },
    },
    set,
    'brick',
    mons,
    'DX@gAB',
  );
}

// The belfry: the bell overhead, the third gear up on a floor, the hammer, and the bell rope.
export const BELFRY_ROWS = [
  '####################',
  '#........12........#',
  '#........34........#',
  '#..................#',
  '#...w..........w...#',
  '#..................#',
  '#..................#',
  '#..............==..#',
  '#..g...............#',
  '#=====....=====....#',
  '#@...........H..R..#',
  '####################',
];

export function belfryMap(set: BlockSet): Stamped {
  return stamp(
    BELFRY_ROWS,
    {
      '#': 'brick',
      '.': 'air',
      '=': 'beam',
      g: 'gear',
      w: 'airWindow',
      '1': 'bell0',
      '2': 'bell1',
      '3': 'bell2',
      '4': 'bell3',
      H: 'hammer',
      R: 'bellRope',
      '@': 'air',
    },
    set,
    'brick',
    undefined,
    '@gHR',
  );
}
