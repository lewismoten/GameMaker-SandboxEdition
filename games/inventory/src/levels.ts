// PICK IT UP's two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts for what
// the letters mean), then given its signs, its things to carry (object blocks) and its monsters.
//
//   1. Step Up:   a brick wall six blocks high, too high to jump. Three wooden crates lie on the ground; P takes one into
//                 the pack, D then Enter puts one down where Mara stands. Three crates put down one on another are a stair. Coins on the wall and past it.
//   2. Your Pick: a flame and a star lie on the ground; carrying one lets Enter throw it (the sequence is tied to the
//                 item). A frosty grump in a brick tunnel needs the flame. Past the tunnel a gumdrop waits across
//                 a strip of spikes: a flame flies two blocks and falls short, a star flies six. Flames go first
//                 in the hero's list, so the star is thrown by putting the flame down (D, Enter).
// Both rooms are closed in by brick walls you can see, so Mara is never stopped by something she can't.
import { Book, LEDGE, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { drawCrate, drawItem } from './itemArt';
import { FROSTY, TARGET } from './monsters';

export type SignName = 'pick' | 'pack' | 'wall' | 'stair' | 'exit' | 'items' | 'order' | 'range';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  pick: { text: 'STAND IN A CRATE AND PRESS P. IT GOES IN YOUR PACK', w: 4, h: 4 },
  pack: { text: 'F2 SHOWS YOUR PACK. ANY KEY SHUTS IT', w: 4, h: 3 },
  wall: { text: 'TOO HIGH TO JUMP. AT THE WALL PRESS D, THEN ENTER', w: 4, h: 4 },
  stair: { text: 'THE CRATE STAYS WHERE YOU DROPPED IT. JUMP ON, DROP THE NEXT', w: 4, h: 5 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
  items: { text: 'P TAKES THE FLAME, THEN THE STAR. ENTER THROWS WHAT YOU CARRY', w: 4, h: 5 },
  order: { text: 'A FLAME COMES FIRST. IT MELTS THE FROSTY GRUMP', w: 4, h: 4 },
  range: { text: 'A FLAME FALLS SHORT OF THAT GUMDROP. D, ENTER SETS IT DOWN. P TAKES IT BACK', w: 4, h: 5 },
};

/** The block set both levels share (and the pack: the inventory holds block numbers): the Starter blocks, the carried things, then the signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  // objects: touching does nothing, P takes one (and the cell turns to sky); put down, the same block stands where Mara was
  book.add('crate', drawCrate(pal), { solid: LEDGE, grav: PULL.down, touch: 'sky', obj: true });
  book.add('starItem', drawItem(pal, 'star'), { touch: 'sky', obj: true });
  book.add('flameItem', drawItem(pal, 'flame'), { touch: 'sky', obj: true });
  // spikes: they stand on the ground at Mara's height and sting her once, ten hit points, when she touches them (then they
  // lie flat). The kit's spikes block is solid and hurts, so a Mara standing on top is stung every tick: not used here.
  const spikes = book.pics.get('spikes')!;
  book.add('spikeUp', spikes, { grav: PULL.down, hp: -10, touch: 'spikeFlat' });
  book.add(
    'spikeFlat',
    spikes.map((_x, y, c) => (y < 11 ? skyOf(pal) : c)),
    { grav: PULL.down },
  );
  const signs = {} as Record<SignName, Sign>;
  for (const n of Object.keys(WORDS) as SignName[]) signs[n] = addSign(book, pal, `${n}.sign`, WORDS[n].text, WORDS[n].w, WORDS[n].h);
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** Where the monsters stand: the row above the ground. */
export const STAND = GROUND - 1;

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: the crates' columns, the wall's (first, last column and its top row), where Mara stands at its foot, and the exit's. */
export const L1 = {
  width: 50,
  exit: 46,
  crates: [10, 12, 14],
  wall: [34, 35],
  wallTop: 4,
  foot: 33,
  coins: [
    [34, 3],
    [35, 3],
    [38, 9],
    [40, 9],
  ],
} as const;
/** Level 2: the items' columns, the frosty grump's wall (first, last column), the grump, the spikes (first, last), the gumdrop and the exit. */
export const L2 = {
  width: 56,
  exit: 52,
  flame: 10,
  star: 13,
  wall: [24, 30],
  frosty: 26,
  spikes: [37, 39],
  lip: 36,
  target: 41,
  coins: [
    [20, 9],
    [33, 9],
    [44, 9],
    [50, 9],
  ],
} as const;

/** Level 1: two crates, and a brick wall too high to jump. 46 blocks wide; the ground is row 10. */
function stepUp(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(L1.width, L1.exit);
  g.fill(L1.wall[0], L1.wallTop, L1.wall[1] - L1.wall[0] + 1, GROUND - L1.wallTop, 'B');
  for (const [x, y] of L1.coins) g.put(x, y, 'c');
  scenery(
    g,
    [
      [6, 2],
      [17, 1],
      [30, 3],
      [41, 1],
    ],
    [8, 19, 44],
    [12, 24, 36],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.pick), signs.pick);
  for (const x of L1.crates) m.set(x, STAND, 'crate');
  m.sign(16, onGround(GROUND, signs.pack), signs.pack);
  m.sign(20, onGround(GROUND, signs.wall), signs.wall);
  m.sign(26, onGround(GROUND, signs.stair), signs.stair);
  m.sign(42, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: a flame and a star to carry, a frosty grump in a brick tunnel, and a gumdrop across the spikes. 56 blocks wide. */
function yourPick(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(L2.width, L2.exit);
  // the wall: brick from the top of the room down to a two-block-high tunnel (rows 8 and 9)
  g.fill(L2.wall[0], 0, L2.wall[1] - L2.wall[0] + 1, 8, 'B');
  for (const [x, y] of L2.coins) g.put(x, y, 'c');
  scenery(
    g,
    [
      [6, 2],
      [15, 1],
      [34, 2],
      [44, 4],
    ],
    [8, 22, 47],
    [12, 32, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(4, onGround(GROUND, signs.items), signs.items);
  m.set(L2.flame, STAND, 'flameItem').set(L2.star, STAND, 'starItem');
  m.sign(16, onGround(GROUND, signs.order), signs.order);
  m.mon(FROSTY, L2.frosty, STAND);
  for (let x = L2.spikes[0]; x <= L2.spikes[1]; x++) m.set(x, STAND, 'spikeUp');
  m.sign(31, onGround(GROUND, signs.range), signs.range);
  m.mon(TARGET, L2.target, STAND);
  m.sign(46, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'inventory');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Step Up', hint: 'P picks up, D puts down.', map: stepUp(book, signs) },
    { file: 'two', title: 'Your Pick', hint: 'What you carry is what you throw.', map: yourPick(book, signs) },
  ];
  return { book, pal, levels };
}
