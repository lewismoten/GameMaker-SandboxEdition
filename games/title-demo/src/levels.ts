// MAKE A TITLE's scenes. Each room is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and exit.
//
//   1. A Menu Picture: pictures come up first (the slots of the title scene, then a menu picture
//      that hides its words, then one that doesn't). Then a hall with a thumbnail of the menu
//      picture on the wall, three signs and a door.
//   2. A Demo That Plays Itself: a diagram of DEMO.REC comes up first. Then a hall with a meter of the
//      1,000 key changes a recording holds, three signs and the door that ends the game.
//
// Both rooms are closed in by brick you can see, so Lian is never stopped by something he can't.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { demoMeter, menuThumb, type Mural } from './props';

/** A link: touching the world cell `from` takes the hero to scene `to` (a key of the scenes, or 'end'), standing at that scene's entrance. */
export interface Way {
  from: [number, number];
  to: string;
}

export interface Scene {
  file: string;
  mapFile: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** The list shown before the scene. */
  before: string;
  links: Way[];
}

export const GROUND = 10;
export const WIDTH = 40;
/** Where each room's signs stand (x of the board's left block), in order, and where its door is. */
export const SIGNS_ONE = [4, 17, 23];
export const SIGNS_TWO = [4, 20, 27];
export const DOOR_ONE = 34;
export const DOOR_TWO = 36;

const WORDS: Record<string, [string, number]> = {
  slot: ['MENU.GIF GOES IN THE MENU GRAPHIC SLOT', 3],
  ontop: ['THE GAME WRITES ON TOP', 2],
  plain: ['KEEP THE BOARD PLAIN', 2],
  record: ['A DEMO IS YOUR KEYS PLAYED BACK', 2],
  idle: ['DEMO SLOT: IT PLAYS AFTER 30 QUIET SECONDS', 3],
  limit: ['EACH PRESS OR RELEASE COUNTS. 1,000 AT MOST', 3],
};

/** The finished block set. */
export function finishBlocks(book: Book): Block[] {
  return book.finish();
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** A hall: grass over dirt, brick at both ends, the entrance at the left, a door at `door`, bushes and flowers. */
function hall(book: Book, door: number, signs: { x: number; sign: Sign }[], mural: { m: Mural; x: number; y: number }): StarterMap {
  const g = new Grid(WIDTH, 15);
  g.row(GROUND, 0, WIDTH - 1, 'G').fill(0, GROUND + 1, WIDTH, 4, 'D');
  g.col(0, 0, 9, 'B').col(WIDTH - 1, 0, 9, 'B');
  g.put(2, 8, 's').put(2, 9, 'S');
  g.put(door, 8, 'e').put(door, 9, 'E');
  for (const [x, y] of [
    [8, 1],
    [27, 2],
    [33, 1],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [8, 20, 31]) g.put(x, GROUND - 1, 'b');
  for (const x of [7, 19, 30, 38]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  signs.forEach((s) => m.sign(s.x, onGround(GROUND, s.sign), s.sign));
  mural.m.names.forEach((row, dy) => row.forEach((n, dx) => m.set(mural.x + dx, mural.y + dy, n)));
  return m;
}

/** The palette, the shared block set and the scenes in order (scene 2 is the first). */
export function buildLevels(): { pal: Pal; book: Book; scenes: Scene[] } {
  const pal = buildStarterPalette(undefined, 'title-demo');
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  for (const [n, [words, h]] of Object.entries(WORDS)) signs[n] = addSign(book, pal, `${n}.sign`, words, 4, h);
  const thumb = menuThumb(book, pal);
  const meter = demoMeter(book, pal);

  const one = hall(
    book,
    DOOR_ONE,
    [signs.slot, signs.ontop, signs.plain].map((sign, i) => ({ x: SIGNS_ONE[i], sign })),
    { m: thumb, x: 10, y: 3 },
  );
  const two = hall(
    book,
    DOOR_TWO,
    [signs.record, signs.idle, signs.limit].map((sign, i) => ({ x: SIGNS_TWO[i], sign })),
    { m: meter, x: 10, y: 5 },
  );
  const scenes: Scene[] = [
    {
      file: 'one',
      mapFile: 'one',
      title: 'A Menu Picture',
      hint: 'The game writes on it.',
      map: one,
      before: 'one.lst',
      links: [{ from: one.exits[0].from, to: 'two' }],
    },
    {
      file: 'two',
      mapFile: 'two',
      title: 'A Demo That Plays Itself',
      hint: 'Keys, and when.',
      map: two,
      before: 'two.lst',
      links: [{ from: two.exits[0].from, to: 'end' }],
    },
  ];
  return { pal, book, scenes };
}
