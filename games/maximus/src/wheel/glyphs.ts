// The Courier's Star Wheel's pictures, one 9 by 9 grid each ('#' ink, '.' paper): ten world marks,
// ten courier marks and six clearance codes. The box's wheel (printables.json) and the hatches on
// Maxima Station's pod bay are drawn from the same rows, so a code on a hatch is the wheel's code.

const N = 9;
const C = 4;

/** A grid from a test of each cell. */
const grid = (on: (x: number, y: number) => boolean): string[] =>
  Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => (on(x, y) ? '#' : '.')).join(''));

const dist = (x: number, y: number) => Math.hypot(x - C, y - C);
const disc = (r: number) => (x: number, y: number) => dist(x, y) <= r;
const ringOf = (lo: number, hi: number) => (x: number, y: number) => dist(x, y) >= lo && dist(x, y) <= hi;
const or =
  (...f: ((x: number, y: number) => boolean)[]) =>
  (x: number, y: number) =>
    f.some((g) => g(x, y));

/** The ten worlds that hold a star-shard, in the order they sit on the middle disc. */
export const WORLDS = [
  'Ambermoor',
  'Brightwater',
  'Cinderfall',
  'Hot Springs',
  'Pearlbed',
  'Mushroom Moon',
  'Prism',
  'Glass Abyss',
  'Hollow Sun',
  'Ghost Station',
] as const;

const WORLD_ROWS: Record<(typeof WORLDS)[number], string[]> = {
  // a ringed planet
  Ambermoor: grid((x, y) => dist(x, y) <= 2.3 || Math.round(C + (x - C) * 0.25) === y),
  // a planet banded with sea
  Brightwater: grid((x, y) => dist(x, y) <= 4.1 && y % 3 !== 2),
  // a cratered planet
  Cinderfall: grid((x, y) => dist(x, y) <= 4.1 && !((x === 3 && y === 3) || (x === 5 && y === 4) || (x === 3 && y === 5) || (x === 5 && y === 6))),
  // a hollow planet with steam rising
  'Hot Springs': grid((x, y) => ringOf(3.2, 4.2)(x, y) || (x === C && y >= 3 && y <= 5)),
  // a crescent moon
  Pearlbed: grid((x, y) => dist(x, y) <= 4.1 && Math.hypot(x - 6, y - 3) > 3.6),
  // a mushroom
  'Mushroom Moon': grid((x, y) => (y <= 4 && ((x - C) / 4.3) ** 2 + ((y - 4) / 3.3) ** 2 <= 1) || (x >= 3 && x <= 5 && y > 4)),
  // a prism
  Prism: grid((x, y) => y >= 1 && y <= 7 && Math.abs(x - C) <= (y - 1) * 0.65 && (Math.abs(x - C) >= (y - 1) * 0.65 - 1.1 || y === 7)),
  // a diamond of glass
  'Glass Abyss': grid((x, y) => Math.abs(x - C) + Math.abs(y - C) <= 4 && Math.abs(x - C) + Math.abs(y - C) >= 3),
  // a hollow sun with its rays
  'Hollow Sun': grid(
    (x, y) =>
      ringOf(1.4, 2.4)(x, y) ||
      (x === C && (y === 0 || y === 8)) ||
      (y === C && (x === 0 || x === 8)) ||
      [1, 7].some((a) => [1, 7].some((b) => x === a && y === b)),
  ),
  // a station: a frame with a cross
  'Ghost Station': grid((x, y) => (x === 1 || x === 7 || y === 1 || y === 7 ? x >= 1 && x <= 7 && y >= 1 && y <= 7 : x === C || y === C)),
};

/** The ten courier marks, in the order they sit on the small disc. */
export const MARKS = ['Dot', 'Ring', 'Bar', 'Plus', 'Cross', 'Square', 'Frame', 'Chevron', 'Triangle', 'Pair'] as const;

const MARK_ROWS: Record<(typeof MARKS)[number], string[]> = {
  Dot: grid(disc(2.2)),
  Ring: grid(ringOf(2.6, 4.2)),
  Bar: grid((x, y) => y >= 3 && y <= 5 && x >= 0 && x <= 8),
  Plus: grid((x, y) =>
    (x >= 3 && x <= 5) !== (y >= 3 && y <= 5) || (x >= 3 && x <= 5 && y >= 3 && y <= 5) ? Math.abs(x - C) <= 1 || Math.abs(y - C) <= 1 : false,
  ),
  Cross: grid((x, y) => Math.abs(x - y) <= 1 || Math.abs(x + y - 8) <= 1),
  Square: grid((x, y) => x >= 1 && x <= 7 && y >= 1 && y <= 7),
  Frame: grid(
    (x, y) =>
      x >= 0 &&
      x <= 8 &&
      y >= 0 &&
      y <= 8 &&
      (x === 0 || x === 8 || y === 0 || y === 8 || x === 1 || x === 7 || y === 1 || y === 7) &&
      !(x >= 2 && x <= 6 && y >= 2 && y <= 6),
  ),
  Chevron: grid((x, y) => Math.abs(Math.abs(x - C) - (8 - y) / 2) <= 0.75 && y >= 1),
  Triangle: grid((x, y) => y >= 1 && y <= 7 && Math.abs(x - C) <= (y - 1) * 0.6),
  Pair: grid((x, y) => Math.hypot(x - 2, y - C) <= 1.6 || Math.hypot(x - 6, y - C) <= 1.6),
};

/** The six clearance codes a hatch can wear. */
export const CODES = ['Rocket', 'Star', 'Bolt', 'Flag', 'Key', 'Heart'] as const;

const CODE_ROWS: Record<(typeof CODES)[number], string[]> = {
  Rocket: ['....#....', '...###...', '...###...', '..#####..', '..#####..', '..#####..', '.#######.', '.#.###.#.', '...#.#...'],
  Star: ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'],
  Bolt: ['.....###.', '....###..', '...###...', '..#####..', '....###..', '...###...', '..###....', '.###.....', '.#.......'],
  Flag: ['#........', '########.', '#########', '#########', '########.', '#........', '#........', '#........', '#........'],
  Key: ['..###....', '.#...#...', '.#...#...', '..###....', '...#.....', '...#.....', '...###...', '...#.....', '...###...'],
  Heart: ['.##...##.', '####.####', '#########', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'],
};

/** Every picture the wheel uses, by the name its rings give it. */
export const GLYPHS: Record<string, string[]> = {
  ...Object.fromEntries(WORLDS.map((w) => [`world ${w}`, WORLD_ROWS[w]])),
  ...Object.fromEntries(MARKS.map((m) => [`mark ${m}`, MARK_ROWS[m]])),
  ...Object.fromEntries(CODES.map((c) => [`code ${c}`, CODE_ROWS[c]])),
};
