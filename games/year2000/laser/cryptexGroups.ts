// "In The Year 2000!" cryptex: the sub-assemblies. One list drives the assembly card sheet (cryptexSteps.ts) and the desk's
// 3D assembly view (web/src/desk/boxes/kitAssemblyModel.ts), so they use the same IDs and words.
// Stack letters follow the build order; layers are numbered from the bottom. Art uses unglued hidden faces; the legend
// and part metadata identify downward assembly faces. All engraving is done sheet face up in one pass.
import { COMBO, LID, STEP, T } from './cryptexDims';

export interface Piece {
  /** the part (cryptexParts.ts key) */
  key: string;
  /** where its underside sits in the finished lock, millimeters above the table */
  z: number;
  /** Side posts stand vertically beside the ring stack. */
  post?: -1 | 1;
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

const layer = (n: number) => T * n;
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
    fit: 'The base stack A stays where it is. The two fixed posts glue to it after the rings are fitted.',
  },
  ...[
    ['B', 4, layer(5), 'it is the biggest'],
    ['C', 3, layer(7), ''],
    ['D', 2, layer(9), ''],
    ['E', 1, layer(11), ''],
  ].map(([id, ring, z]): Group => {
    const n = ring as number;
    const L = id as string;
    return {
      id: L,
      title: `${L}: ring ${n}`,
      pieces: [
        { key: `${L}1`, z: z as number },
        { key: `${L}2`, z: (z as number) + T },
      ],
      at: [[50, 170, 270, 350][4 - n], 190],
      spin: n === 1 ? -COMBO[0] * STEP : 0,
      build: `Glue ring ${n} (stack ${L}): ${L}2 digits up over ${L}1 artwork down, outer edges flush. Glue only blank mating faces; keep glue off the socket.`,
      why: 'A ring must turn freely on the core, so it is glued to nothing else. Rings are made apart and cure at the same time.',
      done: `Sub-assembly ${L} is one solid: ring ${n}, a rim under the digit slice.`,
      fit: `Stack ring ${n} (stack ${L}) digits up, ${n === 4 ? 'on base A' : 'on the previous ring'}. It must turn freely; core F goes in after the bridge.`,
    };
  }),
  {
    id: 'F',
    title: 'F: the core',
    pieces: [
      ...slices('COREC', 1, 4),
      ...[5, 7, 9, 11].flatMap((n) => [{ key: 'CORER', z: layer(n) }, ...(n < 11 ? [{ key: 'COREC', z: layer(n + 1) }] : [])]),
      { key: 'COREC', z: layer(12) },
      { key: 'CORE0', z: layer(13) },
    ],
    at: [200, 57],
    spin: 0,
    build:
      'Glue the 13 core slices from the bottom: four COREC, then alternating CORER and COREC (four CORER, three COREC), one more COREC, then solid CORE0 artwork down as the ceiling. Glue only the blank wall annuli. Alternate plywood grain; no glue in the bore or over the ceiling picture.',
    why: 'It is the one part that must stay straight and slide out of the rings, so it is glued as a stack on a rolled tube that lines up the holes.',
    done: 'Sub-assembly F is one solid: a tube open at the bottom, closed at the top, with four aligned ridge tabs beneath the locking faces.',
    fit: 'Dial 2000, then lower core F through the bridge, open end down onto A1, its ridge tabs to the marker. The glued A1 floor closes the bore. Do not glue the core.',
  },
  ...[4, 3, 2, 1].map((n): Group => {
    const z = layer(5 + (4 - n) * 2);
    return {
      id: `G${n}`,
      title: `G${n}: washer pair`,
      pieces: [
        { key: `G${n}B`, z },
        { key: `G${n}`, z: z + T },
      ],
      at: [[230, 170, 110, 50][n - 1], 270],
      spin: 0,
      build: `Glue ID-marked G${n}B below artwork G${n}, artwork up and outer decagon flats aligned (${(2 * T).toFixed(2)} mm). Glue the mating faces, including the small lower ID; keep the lower circular relief and upper notch clean.`,
      why: 'Two washers make a part as thick as its ring, and the pair stays loose so it can be lifted out and turned.',
      done: `Sub-assembly G${n} is one solid washer for ring ${n}.`,
      fit: `Drop washer pair G${n} into the socket of ring ${n}, notch to the marker. Do not glue it.`,
    };
  }),
  {
    id: 'H',
    title: 'H: the head',
    pieces: [{ key: 'HEAD', z: layer(14) }],
    at: [260, 57],
    spin: 0,
    build: 'The head H is one slice. It has no sub-assembly.',
    why: 'Only the head is glued on the core, and it goes on last, above the retaining bridge. The bridge captures the rings and washers.',
    done: 'The head H is ready.',
    fit: 'Glue head H artwork down on the core, above the retaining bridge. Glue only the blank core wall annulus; keep glue off the bridge, rings and artwork. Let cure. To load a note, dial 2000 and pull only F with H. Load through the open bottom, lower F over the note onto A1 and scramble the rings.',
  },
  {
    id: 'I',
    title: 'I: the fixed posts',
    pieces: [
      { key: 'LIDP', z: 0, post: -1 },
      { key: 'LIDP', z: 0, post: 1 },
    ],
    at: [305, 57],
    spin: 0,
    build: 'LIDP are two upright side posts. Dry-fit their feet in A1. The mushroom heads point up, outside ring 4.',
    why: 'The posts anchor the retaining bridge to the base, so the ring stack cannot lift off A1.',
    done: 'Posts I are ready to glue into A1 during final assembly.',
    fit: 'Glue the feet of both LIDP posts into A1. Let cure. Keep the mushroom tops clean; no glue on the bridge.',
  },
  {
    id: 'J',
    title: 'J: the retaining bridge',
    pieces: [{ key: 'LID', z: LID.top }],
    at: [365, 57],
    spin: 0,
    build: 'LID is the retaining bridge, artwork down. It is one piece, with a notched core passage and two post keyholes.',
    why: 'The post heads trap the bridge vertically. The inserted core blocks the sideways slide needed to release it.',
    done: 'Bridge J stays unglued; it can be released only after the core is unlocked and withdrawn.',
    fit: 'With core F still out, shift bridge J 6 mm toward the title edge, lower its wide keyholes over the post heads, then slide it 6 mm back to center. Do not glue J. The core goes through its passage next and blocks the release slide.',
  },
];

/** The order the finished sub-assemblies go into the lock. */
export const FIT_ORDER = ['B', 'G4', 'C', 'G3', 'D', 'G2', 'E', 'G1', 'I', 'J', 'F', 'H'];

/** "Set your own code": the washer pair for ring 1 is lifted, turned and dropped back; each digit is one STEP. */
export const CODE_TURN = 3;
export const CODE_STEPS = [
  'To set your own code, dial 2 0 0 0 and pull core F with head H straight up and out. The bridge and posts stay on the base.',
  'Slide bridge J 6 mm toward the title edge. The core must be out first.',
  'Lift bridge J off the post heads and set it aside.',
  'Lift ring 1 (stack E) off and set it aside. The washer pair G1 stays loose.',
  'Lift the washer pair G1 out of its socket.',
  `Turn G1 so its notch lies under the digit you want. One digit is ${STEP} degrees: three digits moves the first digit from 2 to 5.`,
  'Drop G1 back in its socket.',
  'Put ring 1 (stack E) back on, then dial it to the new digit. Do the same for D and G2, C and G3, B and G4.',
  'Lower bridge J through its wide keyholes over the post heads, 6 mm toward the title edge.',
  'Slide bridge J 6 mm back to center, with the post necks in the narrow keyholes.',
  'Push core F back through J. Read the code from ring 1 out along the marker.',
];
