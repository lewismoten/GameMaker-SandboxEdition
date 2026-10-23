// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the domes, the
// CitiCar, the billboards and neon signs, the crater, the rocket, the banner, the pinball
// machines, the teletype and the ticker, and that their art joins up across the block edges.
// Run by tools/check.ts.
import { alignGame, namesOf, type Need, type PartRule } from '../../kit/align';
import { LEVELS, SETS } from '../src/levels/levels';

/** Pictures named <name><n>, n = row * columns + column: [columns, rows]. */
const BIGS: Record<string, [number, number]> = {
  dome: [4, 3],
  domeB: [4, 3],
  mdome: [4, 3],
  citi: [2, 2],
  bbHome: [3, 2],
  bbInfo: [3, 2],
  bbFax: [3, 2],
  bbMoon: [3, 2],
  bbWelcome: [3, 2],
  nArcade: [3, 1],
  nTv: [3, 1],
  nPill: [3, 1],
  crater: [2, 2],
  ttyBody: [2, 1],
  plaque: [3, 1],
  rocket: [2, 3],
  banner: [8, 1],
};
// the CitiCar's lit headlight frames stand in for its part 2
const alias = (n: string) => (n === 'citiLit' || n === 'citiLit2' ? 'citi2' : n);
const big = new RegExp(`^(${Object.keys(BIGS).join('|')})(\\d+)$`);

const RULES: PartRule[] = [
  {
    part: { test: (n) => big.test(alias(n)) },
    need: (m) => {
      const [, name, k] = big.exec(alias(m[0]))!;
      const [w, h] = BIGS[name];
      const [c, r] = [Number(k) % w, Math.floor(Number(k) / w)];
      const out: Need = [];
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const want = `${name}${j * w + i}`;
          if (i !== c || j !== r) out.push([i - c, j - r, { test: (g) => alias(g) === want, toString: () => want }]);
        }
      return out;
    },
  },
  { part: /^pinTop2?$/, need: [[0, 1, /^pin(ball|Tilt)$/]] },
  { part: /^pin(ball|Tilt)$/, need: [[0, -1, /^pinTop2?$/]] },
  {
    part: /^ttyL(\d+)$/,
    need: (m) => [
      [1, 0, `ttyR${m[1]}`],
      [0, 1, 'ttyBody0'],
      [1, 1, 'ttyBody1'],
    ],
  },
  { part: /^ttyR\d+$/, need: [[-1, 0, /^ttyL\d+$/]] },
  // the ticker's letters step two at a time
  {
    part: /^tick(\d+)$/,
    need: (m) => [[1, 0, { test: (g) => !/^tick\d+$/.test(g) || g === `tick${(Number(m[1]) + 2) % 30}`, toString: () => `tick${(Number(m[1]) + 2) % 30}` }]],
  },
];

/** Joins drawn as edges on purpose (looked at): the rocket's fins and band, the teletype's paper. */
const SEAM_OK = ['ttyL0/ttyBody0', 'rocket2/rocket4', 'rocket3/rocket5'];

export function align(): number {
  const names = new Map(LEVELS.map((l) => [`${l.file}.map`, namesOf(new Map(SETS[l.set]().names.map((n: string, i: number) => [n, i])))]));
  return alignGame('year2000', (m) => names.get(m), RULES, { seamOk: SEAM_OK });
}
