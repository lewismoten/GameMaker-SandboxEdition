// The Face Dial's nine faces and eight signs, as pixel pictures: rows of '#' (ink) and '.' (paper).
// A face is 12 wide and 12 tall, so it splits cleanly into a top half (rows 0 to 5, on the big
// disc) and a bottom half (rows 6 to 11, on the small one). Most are drawn as a left half and
// mirrored; Gwinn is not (one ear up, one flopped). The signs are 6 by 6, small enough to fit
// seven side by side on a gate (the build draws these same rows onto the Firefly Meadow gates, and
// printables.json carries them for the wheel; web/src/manual/printables/teddyDecoder.test.ts checks
// the two match).

/** Twelve columns from a left half of six (the right side is its mirror image). */
const mirror = (half: string[]): string[] => half.map((r) => r + [...r].reverse().join(''));

export const FACES: Record<string, string[]> = {
  // a corgi: tall ears that match, a white blaze, a pink tongue
  Teddy: mirror(['.##...', '#..#..', '#...##', '#.....', '#.##..', '#.....', '.#...#', '.#..##', '..#.#.', '..#.#.', '...###', '....#.']),
  // a shaggy rescue: one ear up, one flopped, wild fur on top
  Gwinn: [
    '#.#..#.#....',
    '##.#.#.#.##.',
    '.#..###..#.#',
    '#..........#',
    '#..##..##..#',
    '#..........#',
    '.#...##...#.',
    '.#..####..#.',
    '..#.#..#.#..',
    '..#..##..#..',
    '...#....#...',
    '....####....',
  ],
  // Doc Leo: a friendly clown, a pointed hat with a pom-pom, a red rubber nose
  'Doc Leo': mirror(['.....#', '....##', '...#.#', '..#..#', '.#####', '#.....', '#.##..', '#.....', '.#..##', '.#...#', '..#.##', '...###']),
  // Juggles: a ruff of curls and a wide smile
  Juggles: mirror(['.#.#.#', '#.#.#.', '#.....', '#..#..', '#.#...', '#.....', '.#.###', '.#..##', '..#...', '..#.##', '...#..', '....##']),
  // Honker: a bowler hat, a big moustache
  Honker: mirror(['..###.', '.#...#', '.#...#', '######', '.#....', '#.....', '#.##..', '#.....', '#.####', '.#####', '..#...', '...###']),
  // Professor Pratfall: a mortarboard and round glasses
  Pratfall: mirror(['######', '.#####', '..#...', '######', '#.....', '#.###.', '#.#.#.', '#.###.', '#.....', '.#.##.', '..#...', '...###']),
  // the Town Crier: a tall hat with a feather, a beard
  Crier: mirror(['....##', '...#.#', '..#..#', '.####.', '######', '#.....', '#.##..', '#.....', '#..#..', '#.####', '.#.#.#', '..#.#.']),
  // a goose: a long beak and a round, wary eye
  Goose: mirror(['..###.', '.#...#', '#....#', '#..##.', '#.#.#.', '#.#...', '#.#.##', '.###.#', '.#..##', '.#...#', '..#..#', '...###']),
  // a balloon poodle: a puff on each ear, a topknot
  Poodle: mirror(['...##.', '..#..#', '##.##.', '#..#..', '##....', '.#.##.', '.#....', '.#..##', '..#.#.', '.##.#.', '#..###', '.###..']),
};
