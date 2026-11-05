// GUSTS' two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs and its clocks.
//
//   1. Wait for the Gust: a stone ledge too high to jump to, and a shaft of air beside a stone
//      slot in the ground. The shaft is calm, then its leaves flutter (the warning), then a gust
//      blows UP the shaft for a few seconds and lifts Kit to the ledge, then it is calm again.
//   2. Windsocks and Shelter: a long wind tunnel through a hill. Gusts blow LEFT along it and push
//      Kit back. Windsocks on the hill droop, twitch and stream in step with the wind, and two
//      little shelters in the tunnel (no wind in them) are somewhere to wait.
//
// Every clock starts when the scene loads and nothing the player does can change one (the manual
// says so). Both rooms end in a visible hedge, so Kit is never stopped by something he can't see,
// and a tunnel's ends are open.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID as SOLID_ALL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { MOODS, awning, back, flags, lantern, pole, roof, rug, slot, sock, tunnel, updraft, type Mood } from './props';
import { CALM, FLUTTER, GUST } from './timing';

/** A block that turns into another after some ticks. */
interface Timed {
  name: string;
  next: string;
  ticks: number;
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  book: Book;
  timed: Timed[];
}

/** The finished block set: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: Pick<Level, 'book' | 'timed'>): Block[] {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}

const AIR = { grav: PULL.down };
/** The pull of each kind of cell: up the shaft in level 1, left along the tunnel in level 2 (down too, so he still falls). */
const UP = { grav: PULL.up };
const LEFT = { grav: PULL.left | PULL.down };
const PULL_OF = { calm: AIR, flutter: AIR };

export const GROUND_ONE = 10;
export const GROUND_TWO = 11;
export const WIDTH_ONE = 40;
export const WIDTH_TWO = 44;
/** Level 1: the shaft's columns, the ledge's row and columns. */
export const SHAFT = [17, 19] as const;
export const LEDGE_ROW = 3;
export const LEDGE = [13, 32] as const;
/** Level 2: the tunnel's first and last columns, and the two shelters' first columns (each 3 wide). */
export const TUNNEL = [13, 37] as const;
export const HUTS = [18, 27] as const;
export const HUT_W = 3;
/** Level 2: the columns of the three windsocks on the hill. */
export const SOCKS = [15, 25, 35] as const;

type SignName = 'flutter' | 'lift' | 'socks' | 'shelter';
const SIGNS: Record<SignName, string> = {
  flutter: 'LEAVES FLUTTER FIRST, THEN A GUST',
  lift: 'A GUST LIFTS YOU. WAIT IN THE SHAFT',
  socks: 'THE WINDSOCK SHOWS THE WIND',
  shelter: 'WAIT IN A SHELTER WHILE IT BLOWS',
};

function startBook(pal: Pal, names: SignName[]): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  for (const n of names) signs[n] = addSign(book, pal, `${n}.sign`, SIGNS[n], 4, 3);
  return { book, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** The block names of a ring: `${kind}.${mood}`. A kind is "up" (the shaft), "side" (the tunnel) or "sock". */
export const ringBlock = (kind: string, mood: Mood) => `${kind}.${mood}`;

/** Adds a ring of three blocks (calm, flutter, gust) that turn into one another, the same in every cell of that kind. */
function addRing(book: Book, timed: Timed[], kind: string, pic: (m: Mood) => ReturnType<typeof updraft>, gust: { grav: number }): void {
  for (const m of MOODS) book.add(ringBlock(kind, m), pic(m), m === 'gust' ? gust : PULL_OF[m]);
  timed.push(
    { name: ringBlock(kind, 'calm'), next: ringBlock(kind, 'flutter'), ticks: CALM },
    { name: ringBlock(kind, 'flutter'), next: ringBlock(kind, 'gust'), ticks: FLUTTER },
    { name: ringBlock(kind, 'gust'), next: ringBlock(kind, 'calm'), ticks: GUST },
  );
}

/** Level 1: one shaft of air, in a ring, under a ledge. */
function waitForTheGust(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['flutter', 'lift']);
  const timed: Timed[] = [];
  book.add('slot', slot(pal), { solid: SOLID_ALL });
  addRing(book, timed, 'up', (m) => updraft(pal, m), UP);
  const g = new Grid(WIDTH_ONE, 15);
  const G = GROUND_ONE;
  g.row(G, 0, WIDTH_ONE - 1, 'G').fill(0, G + 1, WIDTH_ONE, 4, 'D');
  g.col(0, 0, 9, 'X').col(WIDTH_ONE - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.row(LEDGE_ROW, LEDGE[0], LEDGE[1], '=');
  g.put(30, LEDGE_ROW - 2, 'e').put(30, LEDGE_ROW - 1, 'E');
  g.row(LEDGE_ROW - 1, 22, 25, 'c');
  g.col(LEDGE[1] + 1, 0, LEDGE_ROW, 'X');
  for (const x of [14, 15]) g.put(x, G - 1, "c");
  scenery(
    g,
    G,
    [
      [6, 1],
      [26, 1],
    ],
    [24, 36],
    [8, 22],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(4, onGround(G, signs.flutter), signs.flutter);
  m.sign(9, onGround(G, signs.lift), signs.lift);
  for (let x = SHAFT[0]; x <= SHAFT[1]; x++) {
    m.set(x, G, 'slot');
    for (let y = LEDGE_ROW + 1; y < G; y++) m.set(x, y, ringBlock('up', 'calm'));
  }
  return { file: 'one', title: 'Wait for the Gust', hint: 'The leaves tell you first.', map: m, book, timed };
}

/** Level 2: a wind tunnel through a hill, windsocks on the hill, two shelters. */
function windsocksAndShelter(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['socks', 'shelter']);
  const timed: Timed[] = [];
  book.add('roof', roof(pal), { solid: SOLID_ALL });
  book.add('flags', flags(pal), { solid: SOLID_ALL });
  book.add('pole', pole(pal), AIR);
  addRing(book, timed, 'side', (m) => tunnel(pal, m), LEFT);
  addRing(book, timed, 'sock', (m) => sock(pal, m), AIR);
  book.add('back', back(pal), AIR);
  book.add('awning', awning(pal), AIR);
  book.add('lantern', lantern(pal), AIR);
  book.add('rug', rug(pal, false), AIR);
  book.add('rugCoin', rug(pal, true), { ...AIR, score: 10, touch: 'rug' });
  const G = GROUND_TWO;
  const g = new Grid(WIDTH_TWO, 16);
  g.row(G, 0, WIDTH_TWO - 1, 'G').fill(0, G + 1, WIDTH_TWO, 4, 'D');
  g.col(0, 0, G - 1, 'X').col(WIDTH_TWO - 1, 0, G - 1, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S').put(41, G - 2, 'e').put(41, G - 1, 'E');
  scenery(
    g,
    G,
    [
      [7, 2],
      [22, 1],
      [38, 2],
    ],
    [2, 12, 40],
    [10, 39],
  );
  // the hill: a stone roof (G-4) with grass on top (G-5) over the tunnel, and the tunnel's flagstone floor
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(G, signs.socks), signs.socks);
  m.sign(9, onGround(G, signs.shelter), signs.shelter);
  for (let x = TUNNEL[0]; x <= TUNNEL[1]; x++) {
    m.set(x, G, 'flags').set(x, G - 4, 'roof').set(x, G - 5, 'grass');
    const hut = HUTS.findIndex((h) => x >= h && x < h + HUT_W);
    if (hut < 0) for (let y = G - 3; y < G; y++) m.set(x, y, ringBlock('side', 'calm'));
    else {
      // a shelter: an awning, a wall with a lantern in the middle, and a rug with a coin at each end
      const mid = x === HUTS[hut] + 1;
      m.set(x, G - 3, 'awning').set(x, G - 2, mid ? 'lantern' : 'back').set(x, G - 1, mid ? 'rug' : 'rugCoin');
    }
  }
  for (const x of SOCKS) m.set(x, G - 6, 'pole').set(x, G - 7, ringBlock('sock', 'calm'));
  return { file: 'two', title: 'Windsocks and Shelter', hint: 'The socks tell you first.', map: m, book, timed };
}

/** The palette and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  return { pal, levels: [waitForTheGust(pal), windsocksAndShelter(pal)] };
}
