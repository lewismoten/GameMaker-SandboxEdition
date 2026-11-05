// DAY AND NIGHT's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, sky and exits.
//
//   1. One Map, Two Looks: a porch, a house with a lit door and a sky with a sun. The door goes to
//      the SAME map again, but the scene loads a different palette: night. The sun is a moon, the
//      windows glow and the stars the day hid are out. Same blocks, same map file.
//   2. Sundown Street: a street with two gates. Each gate goes to the same map in a later palette:
//      day, then dusk, then night. A scene change always fades the map in from black, so each
//      step of the sunset is a fade.
//
// A "stage" is one scene of a level: a palette and the links that lead out of it. A level with
// several stages loads the same .MAP and .BBL in each; only the palette slot differs. Nothing in
// the map or the blocks knows what time it is.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { buildPalettes, type Palettes } from './palettes';
import { gateTop, lanternBrick, orb, pillar, post, postTop, roof, star, windowBrick } from './props';

export type Hour = 'day' | 'dusk' | 'night';

/** One scene of a level: which palette it loads, whether a level card comes first, where the hero stands on arriving, and the cells that take her on (world blocks). */
export interface Stage {
  hour: Hour;
  card: boolean;
  enter: [number, number];
  links: [number, number][];
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  book: Book;
  stages: Stage[];
}

/** The finished block set. */
export const finishBlocks = (l: Pick<Level, 'book'>): Block[] => l.book.finish();

export const GROUND = 10;
export const WIDTH_ONE = 30;
export const WIDTH_TWO = 41;
/** Level 1's door (its bottom block column), the gates' middle columns and level 2's cottage door. */
export const DOOR_ONE = 25;
export const GATES = [11, 23] as const;
export const DOOR_TWO = 34;

type SignName = 'palettes' | 'sun' | 'door' | 'gate' | 'steps' | 'fade';
const SIGNS: Record<SignName, string> = {
  palettes: 'SAME MAP, TWO PALETTES: DAY AND NIGHT',
  sun: 'SUN BY DAY, MOON BY NIGHT: ONE BLOCK',
  door: 'THE DOOR GOES TO A NEW SCENE WITH A NEW PALETTE',
  gate: 'AT A GATE THE SCENE CHANGES. SAME MAP, NEW PALETTE',
  steps: 'THREE PALETTES. GATES GO ONE WAY',
  fade: 'A SCENE FADES IN FROM BLACK: THAT IS THE FADE',
};

function startBook(pal: Pal, names: SignName[]): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const air = { grav: PULL.down };
  book.add('orb', orb(pal), air);
  book.add('star', star(pal), air);
  book.add('window', windowBrick(pal, book.pics.get('brick')!), { solid: SOLID });
  book.add('lantern', lanternBrick(pal, book.pics.get('brick')!), { solid: SOLID });
  book.add('roof', roof(pal), { ...air, solid: SOLID });
  book.add('post.top', postTop(pal), air);
  book.add('post', post(pal), air);
  book.add('pillar', pillar(pal), air);
  for (const part of ['l', 'm', 'r'] as const) book.add(`gate.${part}`, gateTop(pal, part), air);
  const signs: Record<string, Sign> = {};
  for (const n of names) signs[n] = addSign(book, pal, `${n}.sign`, SIGNS[n], 4, 3);
  return { book, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

const world = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** Level 1: the same room by day and by night. */
function oneMapTwoLooks(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['palettes', 'sun', 'door']);
  const g = new Grid(WIDTH_ONE, 15);
  g.row(GROUND, 0, WIDTH_ONE - 1, 'G').fill(0, GROUND + 1, WIDTH_ONE, 4, 'D');
  g.col(0, 0, 9, 'B').col(WIDTH_ONE - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  for (const [x, y] of [
    [8, 4],
    [14, 5],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [8, 19]) g.put(x, GROUND - 1, 'b');
  for (const x of [14, 17]) g.put(x, GROUND - 1, 'f');
  // the house: a roof, brick walls, a porch under its front and a door at the porch's end
  g.fill(20, 4, 9, 4, 'B').fill(26, 8, 3, 2, 'B');
  g.fill(20, 9, 4, 1, 'c');
  g.put(DOOR_ONE, 8, 'e').put(DOOR_ONE, 9, 'E');
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.palettes), signs.palettes);
  m.sign(10, onGround(GROUND, signs.sun), signs.sun);
  m.sign(15, onGround(GROUND, signs.door), signs.door);
  for (let x = 20; x <= 28; x++) m.set(x, 3, 'roof');
  for (const x of [21, 23, 27]) m.set(x, 5, 'window');
  m.set(DOOR_ONE, 7, 'lantern');
  m.set(17, 1, 'orb');
  for (const [x, y] of [
    [2, 1],
    [6, 0],
    [12, 1],
    [13, 3],
    [20, 0],
    [24, 1],
    [27, 0],
    [4, 4],
  ])
    m.set(x, y, 'star');
  const door = world(DOOR_ONE, 9);
  const enter = m.start;
  return {
    file: 'one',
    title: 'One Map, Two Looks',
    hint: 'Go in the door, then look again.',
    map: m,
    book,
    stages: [
      { hour: 'day', card: true, enter, links: [door] },
      { hour: 'night', card: false, enter, links: [door] },
    ],
  };
}

/** Level 2: a street, and a gate for each step of the sunset. */
function sundownStreet(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['gate', 'steps', 'fade']);
  const g = new Grid(WIDTH_TWO, 15);
  g.row(GROUND, 0, WIDTH_TWO - 1, 'G').fill(0, GROUND + 1, WIDTH_TWO, 4, 'D');
  g.col(0, 0, 9, 'B').col(WIDTH_TWO - 1, 0, 9, 'B');
  g.put(2, 8, 's').put(2, 9, 'S');
  for (const [x, y] of [
    [8, 4],
    [20, 3],
    [27, 5],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [7, 14, 21]) g.put(x, GROUND - 1, 'b');
  for (const x of [9, 13, 20]) g.put(x, GROUND - 1, 'f');
  for (const [x, y] of [
    [8, 9],
    [20, 9],
    [14, 8],
    [21, 8],
  ])
    g.put(x, y, 'c');
  // the cottage at the street's end: its door is the left-hand column, so the street leads straight to it
  g.fill(DOOR_TWO, 7, 6, 3, 'B');
  g.put(DOOR_TWO, 8, 'e').put(DOOR_TWO, 9, 'E');
  const m = new StarterMap(book, g.rows());
  m.sign(4, onGround(GROUND, signs.gate), signs.gate);
  m.sign(15, onGround(GROUND, signs.steps), signs.steps);
  m.sign(27, onGround(GROUND, signs.fade), signs.fade);
  for (let x = DOOR_TWO; x <= DOOR_TWO + 5; x++) m.set(x, 6, 'roof');
  m.set(DOOR_TWO, 7, 'lantern');
  m.set(DOOR_TWO + 2, 8, 'window').set(DOOR_TWO + 4, 8, 'window');
  // two gates: a lintel with a lantern, and a pillar either side of the way through
  for (const mid of GATES) {
    m.set(mid - 1, 7, 'gate.l')
      .set(mid, 7, 'gate.m')
      .set(mid + 1, 7, 'gate.r');
    for (const y of [8, 9]) m.set(mid - 1, y, 'pillar').set(mid + 1, y, 'pillar');
  }
  // street lamps that only light at night
  for (const x of [19, 32]) {
    m.set(x, 7, 'post.top').set(x, 8, 'post').set(x, 9, 'post');
  }
  m.set(35, 3, 'orb');
  for (const [x, y] of [
    [3, 1],
    [9, 0],
    [14, 2],
    [19, 0],
    [24, 1],
    [29, 0],
    [33, 1],
    [38, 0],
    [12, 4],
    [37, 2],
  ])
    m.set(x, y, 'star');
  const through = (mid: number): [number, number][] => [world(mid, 9), world(mid, 8)];
  const door = world(DOOR_TWO, 9);
  return {
    file: 'two',
    title: 'Sundown Street',
    hint: 'Walk through the gates.',
    map: m,
    book,
    stages: [
      { hour: 'day', card: true, enter: m.start, links: through(GATES[0]) },
      { hour: 'dusk', card: false, enter: world(GATES[0] + 2, 9), links: through(GATES[1]) },
      { hour: 'night', card: false, enter: world(GATES[1] + 2, 9), links: [door] },
    ],
  };
}

/** The palettes and the levels in order. */
export function buildLevels(): { pal: Pal; pals: Palettes; levels: Level[] } {
  const pals = buildPalettes();
  return { pal: pals.pal, pals, levels: [oneMapTwoLooks(pals.pal), sundownStreet(pals.pal)] };
}
