// LIGHTNING's two levels, painted on a Grid (see games/kit/starter/map.ts for the letters), each with its own block set
// (one.bbl, two.bbl). After a level is laid, every block on it that shows sky gets a lit twin (storm.ts), so the whole
// sky flashes in one tick.
//
//   1. Flash and Rumble: a field at night under storm clouds. The sky flashes, a bolt of five blocks shows for that
//      moment over a hill, and the song plays a low rumble a beat later.
//   2. Light the Way: a dark ditch with three stepping stones. The stones have lit twins too, so the flash lights the
//      way over, but they are dim, not hidden: the stones can always be seen. Falling in hurts nothing; steps lead out.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { BOLT, addBolt, addCloud, addHill, addLitTwins, addStone, stormPalette, type Timed } from './storm';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  book: Book;
  /** The blocks that turn into others by themselves. */
  timed: Timed[];
  map: StarterMap;
  /** The bolt's column and its top row (level blocks). */
  bolt: [number, number];
  /** Level 2's stones: the columns of each stone's two blocks, in order. */
  stones: number[][];
}

const WORDS = {
  sky: { rows: [['THE SKY TURNS'], ['LIGHT FOR'], ['A MOMENT']] },
  bolt: { rows: [['THE BOLT IS'], ['5 BLOCKS THAT'], ['SHOW FOR'], ['A MOMENT']] },
  thunder: { rows: [['THE SONG PLAYS'], ['THE THUNDER,'], ['A BEAT LATER']] },
  stones: { rows: [['THE STONES'], ['LIGHT UP'], ['WITH THE SKY']] },
  always: { rows: [['DIM, BUT YOU'], ['CAN ALWAYS'], ['SEE THEM']] },
} as const;
type SignName = keyof typeof WORDS;

/** The ground's top row in both levels: signs stand on it. */
export const GROUND = 11;
const onGround = (s: Sign) => GROUND - 1 - s.board.length;

interface Built {
  book: Book;
  timed: Timed[];
  signs: Record<SignName, Sign>;
  clouds: { two: string[]; three: string[] };
  hill: string[][];
}

/** A level's block set: the Starter blocks, its signs, the clouds, the hill and the bolt (and level 2's stone). */
function blocks(pal: Pal, level: 1 | 2): Built {
  const book = new Book('bbl');
  const timed: Timed[] = [];
  addStarterBlocks(book, pal);
  // Build the complete sign vocabulary together; each level keeps only the tiles it uses.
  const { blocks: tiles, signs } = buildTiledSigns(WORDS, {
    colors: {
      background: skyOf(pal),
      paper: pal.c('parch', 3),
      ink: pal.c('ink', 0),
      wood: pal.c('wood', 2),
      highlight: pal.c('wood', 4),
      shadow: pal.c('wood', 0),
    },
    lettersPerBlock: 3,
    maxBlocks: 100 - book.index.size,
  });
  const used: SignName[] = level === 1 ? ['sky', 'bolt', 'thunder'] : ['stones', 'always'];
  const needed = new Set(used.flatMap((k) => [...signs[k].board.flat(), signs[k].post!.block]));
  for (const [name, pic] of tiles) if (needed.has(name)) book.add(name, pic, { grav: PULL.down });
  const clouds = { two: addCloud(book, pal, 2), three: addCloud(book, pal, 3) };
  const hill = addHill(book, pal);
  addBolt(book, timed, pal);
  if (level === 2) addStone(book, timed, pal);
  return { book, timed, signs, clouds, hill };
}

/** Lays the clouds, the hill and the bolt: the bolt in column `x`, from under a cloud down to the ground, the hill beside it. Every
 *  piece sits in the six rows above the hero's feet, the part of the sky the screen shows from the ground. */
function storm(m: StarterMap, b: Built, x: number, more: [number, number, 2 | 3][]): [number, number] {
  const top = GROUND - BOLT; // the bolt's top row: the bolt ends on the ground, so the cloud above it is the screen's top row
  b.clouds.three.forEach((name, i) => m.setOnSky(x - 1 + i, top - 1, name));
  for (let i = 0; i < BOLT; i++) m.setOnSky(x, top + i, `bolt.${i}`);
  b.hill.forEach((row, dy) => row.forEach((name, dx) => m.setOnSky(x + 1 + dx, GROUND - 2 + dy, name)));
  for (const [cx, cy, w] of more) (w === 2 ? b.clouds.two : b.clouds.three).forEach((name, i) => m.set(cx + i, cy, name));
  return [x, top];
}

/** Every block name laid on the level's map (inside the 100x100 world, the sky and ground round it too). */
function laid(m: StarterMap, book: Book): Set<string> {
  const names = [...book.index.keys()];
  return new Set([...new Set(m.map.blocks)].map((n) => names[n]));
}

/** Level 1: 44 blocks wide; three signs, one bolt over a hill. */
function flashAndRumble(pal: Pal): Level {
  const b = blocks(pal, 1);
  const g = new Grid(44, 15);
  g.row(GROUND, 0, 43, 'G').fill(0, GROUND + 1, 44, 3, 'D');
  g.col(0, 0, GROUND - 1, 'X').col(43, 0, GROUND - 1, 'X');
  g.put(3, GROUND - 2, 's').put(3, GROUND - 1, 'S');
  g.put(40, GROUND - 2, 'e').put(40, GROUND - 1, 'E');
  for (const x of [10, 31]) g.put(x, GROUND - 1, 'b');
  for (const x of [17, 28, 36]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(b.book, g.rows());
  stampTiledSign({ set: m.setOnSky.bind(m) }, 5, onGround(b.signs.sky), b.signs.sky);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 12, onGround(b.signs.bolt), b.signs.bolt);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 24, onGround(b.signs.thunder), b.signs.thunder);
  const bolt = storm(m, b, 19, [
    [6, 5, 2],
    [27, 5, 3],
    [34, 5, 2],
  ]);
  addLitTwins(b.book, b.timed, pal, laid(m, b.book));
  return { file: 'one', title: 'Flash and Rumble', hint: 'A flash, a bolt, then a rumble.', book: b.book, timed: b.timed, map: m, bolt, stones: [] };
}

/** Level 2: 46 blocks wide; a ditch two deep with three stones over it, steps out of it on the left. */
function lightTheWay(pal: Pal): Level {
  const b = blocks(pal, 2);
  const g = new Grid(46, 15);
  const ditch = [14, 27];
  g.row(GROUND, 0, ditch[0] - 1, 'G').row(GROUND, ditch[1] + 1, 45, 'G');
  g.fill(0, GROUND + 1, ditch[0], 3, 'D').fill(ditch[1] + 1, GROUND + 1, 45 - ditch[1], 3, 'D');
  g.row(GROUND + 2, ditch[0], ditch[1], 'G').fill(ditch[0], GROUND + 3, ditch[1] - ditch[0] + 1, 1, 'D');
  g.put(ditch[0], GROUND + 1, 'D'); // the step out, on the left
  g.col(0, 0, GROUND - 1, 'X').col(45, 0, GROUND - 1, 'X');
  g.put(2, GROUND - 2, 's').put(2, GROUND - 1, 'S');
  g.put(42, GROUND - 2, 'e').put(42, GROUND - 1, 'E');
  for (const x of [30, 39]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(b.book, g.rows());
  const stones = [
    [16, 17],
    [20, 21],
    [24, 25],
  ];
  for (const s of stones) for (const x of s) m.set(x, GROUND, 'stone');
  // Spread the wider boards one cell each way; both posts still meet the left bank.
  stampTiledSign({ set: m.setOnSky.bind(m) }, 3, onGround(b.signs.stones), b.signs.stones);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 10, onGround(b.signs.always), b.signs.always);
  const bolt = storm(m, b, 34, [
    [7, 5, 2],
    [19, 5, 3],
    [39, 5, 2],
  ]);
  addLitTwins(b.book, b.timed, pal, laid(m, b.book));
  return { file: 'two', title: 'Light the Way', hint: 'Stones over a ditch in the dark.', book: b.book, timed: b.timed, map: m, bolt, stones };
}

/** The levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = stormPalette();
  return { pal, levels: [flashAndRumble(pal), lightTheWay(pal)] };
}
export type { SignName };
