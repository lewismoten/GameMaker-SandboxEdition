// Checks the multi-block objects on the built disk's maps (games/kit/align.ts): the houses (roof
// over eaves over a one-colored front), garages, the mall, the stores, the arcade, the signs,
// the parked cars (and THE CHEZ), the fair's strongman bell, the lot's cart return, and that
// their art joins up across the block edges (Jamie Street by its own set's names, JAMIE.BBL).
// Run by tools/check.ts.
import { alignGame, namesOf, type Need, type PartRule } from '../../kit/align';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { hillBook } from '../src/blocks/hill';

const is = (...s: string[]) => ({ test: (g: string) => s.includes(g), toString: () => s.join('|') });
const roofMid = ['roofM', 'chimney', 'chimney2'];
const eave = (e: string) => [`eave${e}`, `eave${e}2`];
const front = /^(red|blue|yellow)(Win|Door|Garage[LR])$/;
/** A run of parts left to right: each wants its neighbors. */
const run = (seq: string[]): PartRule[] =>
  seq.map((n, i) => ({ part: n, need: [...(i > 0 ? [[-1, 0, seq[i - 1]]] : []), ...(i < seq.length - 1 ? [[1, 0, seq[i + 1]]] : [])] as Need }));

export function align(): number {
  const noon = buildPalette('noon');
  const book = buildBlocks(noon);
  const names = namesOf(book.index);
  // Jamie Street has its own copy of the set (JAMIE.BBL), with the run's blocks in the houses' slots
  const hill = namesOf(hillBook(book, noon).index);
  const RULES: PartRule[] = [
    {
      part: 'roofL',
      need: [
        [1, 0, is(...roofMid)],
        [0, 1, is(...eave('L'))],
      ],
    },
    {
      part: 'roofR',
      need: [
        [-1, 0, is(...roofMid)],
        [0, 1, is(...eave('R'))],
      ],
    },
    ...roofMid.map((n): PartRule => ({
      part: n,
      need: [
        [-1, 0, is('roofL', ...roofMid)],
        [1, 0, is('roofR', ...roofMid)],
        [0, 1, is(...eave('M'))],
      ],
    })),
    ...eave('L').map((n): PartRule => ({
      part: n,
      need: [
        [0, -1, 'roofL'],
        [1, 0, is(...eave('M'))],
        [0, 1, front],
      ],
    })),
    ...eave('R').map((n): PartRule => ({
      part: n,
      need: [
        [0, -1, 'roofR'],
        [-1, 0, is(...eave('M'))],
        [0, 1, front],
      ],
    })),
    ...eave('M').map((n): PartRule => ({
      part: n,
      need: [
        [0, -1, is(...roofMid)],
        [-1, 0, is(...eave('L'), ...eave('M'))],
        [1, 0, is(...eave('R'), ...eave('M'))],
        [0, 1, front],
      ],
    })),
    // a house's front is one color under its eaves
    { part: front, need: [[0, -1, /^eave/]] },
    {
      part: front,
      joins: false,
      need: (m) => [
        ...[-1, 1].map((dx): [number, number, { test(g: string): boolean; toString(): string }] => [
          dx,
          0,
          { test: (g) => !front.test(g) || g.startsWith(/^(red|blue|yellow)/.exec(m[0])![1]), toString: () => `${/^(red|blue|yellow)/.exec(m[0])![1]} front` },
        ]),
      ],
    },
    ...['red', 'blue', 'yellow'].flatMap((c) => run([`${c}GarageL`, `${c}GarageR`])),
    ...run(['mall0', 'mall1', 'mall2', 'mall3', 'mall4', 'mall5']),
    ...run(['store0', 'store1', 'store2', 'store3', 'store4']),
    ...[0, 1, 2].map((i): PartRule => ({
      part: new RegExp(`^arcade[01]${i}$`),
      need: [...(i > 0 ? [[-1, 0, new RegExp(`^arcade[01]${i - 1}$`)]] : []), ...(i < 2 ? [[1, 0, new RegExp(`^arcade[01]${i + 1}$`)]] : [])] as Need,
    })),
    ...[...book.index.keys()].filter((n) => /^st.*0$/.test(n) && book.index.has(n.slice(0, -1) + '1')).flatMap((n) => run([n, n.slice(0, -1) + '1'])),
    ...run(['board0', 'board1']),
    ...run(['cartSign0', 'cartSign1', 'cartCorral']),
    ...['blueCar', 'greenCar', 'tanCar'].flatMap((n) => run([`${n}L`, `${n}R`])),
    ...run(['chezL', 'chezR']),
    { part: 'fairMan', need: [[1, 0, /^fairBell[LR]?$/]] },
    {
      part: /^fairBell[LR]?$/,
      need: [
        [-1, 0, 'fairMan'],
        [1, 0, 'fairFlag'],
      ],
    },
    { part: 'fairFlag', need: [[-1, 0, /^fairBell[LR]?$/]] },
  ];
  return alignGame('snowbound', (map) => (map === 'jamie.map' ? hill : names), RULES);
}
