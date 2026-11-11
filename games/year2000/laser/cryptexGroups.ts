// "In The Year 2000!" cryptex: the sub-assemblies. One list drives the assembly card sheet (cryptexSteps.ts) and the desk's
// 3D assembly view (web/src/desk/boxes/kitAssemblyModel.ts), so they use the same IDs and words.
// Stack letters follow the build order; layers are numbered from the bottom. A1, A2R... are engraved on a face that ends up
// covered (the legend on the assembly sheet says which); the core slices and the plugs have no room for letters and are unmarked.
import { COMBO, STEP } from './cryptexDims';

export interface Piece {
  /** the part (cryptexParts.ts key) */
  key: string;
  /** where its underside sits in the finished lock, millimeters above the table */
  z: number;
}
export interface Group {
  id: string;
  title: string;
  pieces: Piece[];
  /** where the finished sub-assembly waits on the table, as the middle of its footprint (the lock's middle is 57, 57) */
  at: [number, number];
  /** degrees it is turned in the finished lock (the first ring shows the first digit at the marker) */
  spin: number;
  /** words for building it, why it is a sub-assembly, the finished view and putting it in the lock */
  build: string;
  why: string;
  done: string;
  fit: string;
}

const layer = (n: number) => 3 * n;
const slices = (key: string, from: number, count: number): Piece[] => Array.from({ length: count }, (_, i) => ({ key, z: layer(from + i) }));

export const GROUPS: Group[] = [
  {
    id: 'A',
    title: 'A: the base stack',
    pieces: [
      { key: 'A1', z: 0 },
      ...[1, 2, 3, 4].flatMap((n) => [
        { key: `A${n + 1}R`, z: layer(n) },
        { key: `A${n + 1}C`, z: layer(n) },
      ]),
    ],
    at: [57, 57],
    spin: 0,
    build:
      'Glue the base stack from the bottom: A1, then A2R and A2C, up to A5R and A5C. Keep the ridge slots of A2C to A5C lined up, on the marker side (right).',
    why: 'It is the slowest to cure and carries the rest, so it goes first, under a weight. Stand the dry core F in the slots as a pin to line the collars up.',
    done: 'Sub-assembly A is one solid: a floor, a hollow ring and a collar round the ridge slot.',
    fit: 'The base stack A stays where it is. Everything else goes on it.',
  },
  ...[
    ['B', 4, 15, 'it is the biggest'],
    ['C', 3, 21, ''],
    ['D', 2, 27, ''],
    ['E', 1, 33, ''],
  ].map(([id, ring, z]): Group => {
    const n = ring as number;
    const L = id as string;
    return {
      id: L,
      title: `${L}: ring ${n}`,
      pieces: [
        { key: `${L}1`, z: z as number },
        { key: `${L}2`, z: (z as number) + 3 },
      ],
      at: [[50, 170, 270, 350][4 - n], 190],
      spin: n === 1 ? -COMBO[0] * STEP : 0,
      build: `Glue ring ${n} (stack ${L}): the top slice ${L}2 with the digits over the plain slice ${L}1, outer edges flush. Keep glue off the socket.`,
      why: 'A ring must turn freely on the core, so it is glued to nothing else. Rings are made apart and cure at the same time.',
      done: `Sub-assembly ${L} is one solid: ring ${n}, a rim under the digit slice.`,
      fit: `Slide ring ${n} (stack ${L}) down over the core, digits up. It must turn freely.`,
    };
  }),
  {
    id: 'F',
    title: 'F: the core',
    pieces: [{ key: 'CORE0', z: 3 }, ...slices('CORER', 2, 2), ...slices('COREC', 4, 9)],
    at: [200, 57],
    spin: 0,
    build:
      'Glue the 12 core slices in a stack: the closed one (CORE0) at the bottom, two with the ridge (CORER, ridges lined up), then nine round ones (COREC). No glue in the hole.',
    why: 'It is the one part that must stay straight and slide out of the rings, so it is glued as a stack on a rolled tube that lines up the holes.',
    done: 'Sub-assembly F is one solid: a tube closed at the bottom, a ridge near it.',
    fit: 'Stand core F in base stack A, its ridge to the marker. Do not glue it.',
  },
  ...[4, 3, 2, 1].map((n): Group => {
    const z = 15 + (4 - n) * 6;
    return {
      id: `G${n}`,
      title: `G${n}: washer pair`,
      pieces: slices(`G${n}`, z / 3, 2),
      at: [[230, 170, 110, 50][n - 1], 270],
      spin: 0,
      build: `Glue the two washers G${n} flat together, notches lined up (6 mm). Keep glue out of the bore and the notch.`,
      why: 'Two washers make a part as thick as its ring, and the pair stays loose so it can be lifted out and turned.',
      done: `Sub-assembly G${n} is one solid washer for ring ${n}.`,
      fit: `Drop washer pair G${n} into the socket of ring ${n}, notch to the marker. Do not glue it.`,
    };
  }),
  {
    id: 'H',
    title: 'H: the head',
    pieces: [{ key: 'HEAD', z: 39 }],
    at: [260, 57],
    spin: 0,
    build: 'The head H is one slice. It has no sub-assembly.',
    why: 'Only the head is glued on the core, and it goes on last, above the rings, so the rings stay on.',
    done: 'The head H is ready.',
    fit: 'Glue head H on the top of the core, over ring 1. Keep glue off the rings.',
  },
  {
    id: 'I',
    title: 'I: the lid',
    pieces: [
      { key: 'LIDP', z: 36 },
      { key: 'LIDP', z: 39 },
      { key: 'LID', z: 42 },
    ],
    at: [305, 57],
    spin: 0,
    build: 'Glue the two plugs under the lid, one on the other.',
    why: 'The plugs press into the core and hold the lid, so they are glued together first.',
    done: 'Sub-assembly I is one solid: the lid with its plug.',
    fit: 'Roll a note and slip it in the core; press lid I in.',
  },
];

/** The order the finished sub-assemblies go into the lock. */
export const FIT_ORDER = ['F', 'B', 'G4', 'C', 'G3', 'D', 'G2', 'E', 'G1', 'H', 'I'];

/** "Set your own code": the washer pair for ring 1 is lifted, turned and dropped back; each digit is one STEP. */
export const CODE_TURN = 3;
export const CODE_STEPS = [
  'To set your own code, dial 2 0 0 0 and pull the core F, with its head H and lid I, straight up and out.',
  'Lift ring 1 (stack E) off and set it aside. The washer pair G1 stays loose.',
  'Lift the washer pair G1 out of its socket.',
  `Turn G1 so its notch lies under the digit you want. One digit is ${STEP} degrees: three digits moves the first digit from 2 to 5.`,
  'Drop G1 back in its socket.',
  'Put ring 1 (stack E) back on, then dial it to the new digit.',
  'Push the core F back in. Do the same for D and G2, C and G3, B and G4. Read the code from ring 1 out along the marker.',
];
