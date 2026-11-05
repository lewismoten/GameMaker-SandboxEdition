// CUTSCENES' scenes. Each room is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and exits.
//
//   1. A Scene That Moves On: a picture and some words come up first (the scene's intro list).
//      Then the room: a stage whose floor is planks that flash and drop away after a few
//      seconds, onto a mat that is a link. Nothing needs a key, so the scene ends by itself.
//   2. A Menu Room: one room, three doors, and each door is a link to a scene of its own. Two
//      lead to a short tale (a picture, words, and the same stage floor, which leads back);
//      the third door ends the game.
//
// The tales are scenes too, but they are not levels: they load a stage map without signs.
// Both rooms are closed in by brick you can see, so Kit is never stopped by something he can't.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { mat, shaft, trap } from './props';
import { FLOOR_AT, QUICK_AT, QUICK_WARN, WARN } from './timing';

/** A block that turns into another after some ticks. */
interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/** A link: touching the world cell `from` takes the hero to scene `to` (a key of the scenes, or 'end'), standing at that scene's entrance. */
export interface Way {
  from: [number, number];
  to: string;
}

export interface Scene {
  file: string;
  /** The scene's own map file (the tales share one). */
  mapFile: string;
  title: string;
  /** What the level card says under the title (levels only). */
  hint: string;
  /** Whether this is one of the game's two levels (it has a card and a "How this level is made" page). */
  level: boolean;
  map: StarterMap;
  /** The list shown before the scene (slot 9). */
  before: string;
  links: Way[];
}

export const GROUND = 10;
export const WIDTH_STAGE = 16;
export const WIDTH_MENU = 40;
export const MAT_ROW = 19;
/** The stage's signs (x of the board's left block) and the menu's. */
export const STAGE_SIGNS = [3, 9];
export const MENU_INFO_X = 5;
export const MENU_LABELS = [12, 21, 30];
export const LEDGE_ROW = 6;
export const MENU_DOORS = [13, 22, 31];

type SignName = 'words' | 'floor' | 'menu' | 'one' | 'two' | 'end';
const SIGNS: Record<SignName, [string, number]> = {
  words: ['A SCENE SHOWS A PICTURE AND WORDS FIRST', 3],
  floor: ['THEN THE ROOM. THE FLOOR DROPS AND TAKES YOU ON', 3],
  menu: ['A MENU IS A ROOM WITH DOORS. PICK ONE', 3],
  one: ['TALE ONE', 1],
  two: ['TALE TWO', 1],
  end: ['THE END', 1],
};

/** The finished block set: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(book: Book, timed: Timed[]): Block[] {
  const blocks = book.finish();
  for (const t of timed) {
    const b = blocks[book.n(t.name)];
    b.nextBl = book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}

const AIR = { grav: PULL.down };

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The stage: a closed room whose whole floor is planks over a shaft, with a mat at the bottom of it. The links are the mat's cells. */
function stage(book: Book, signs: Record<string, Sign> | undefined, floor: 'trap' | 'quick'): { map: StarterMap; mat: [number, number][] } {
  const g = new Grid(WIDTH_STAGE, 22);
  g.row(2, 0, WIDTH_STAGE - 1, 'B')
    .col(0, 2, 19, 'B')
    .col(WIDTH_STAGE - 1, 2, 19, 'B')
    .fill(0, 20, WIDTH_STAGE, 2, 'D');
  g.put(1, 8, 's').put(1, 9, 'S');
  const m = new StarterMap(book, g.rows());
  if (signs) {
    m.sign(STAGE_SIGNS[0], onGround(GROUND, signs.words), signs.words);
    m.sign(STAGE_SIGNS[1], onGround(GROUND, signs.floor), signs.floor);
  }
  const ways: [number, number][] = [];
  for (let x = 1; x < WIDTH_STAGE - 1; x++) {
    m.set(x, GROUND, `${floor}.shut`);
    for (let y = GROUND + 1; y < MAT_ROW; y++) m.set(x, y, 'shaft');
    m.set(x, MAT_ROW, 'mat');
    ways.push([x + ORIGIN, MAT_ROW + ORIGIN]);
  }
  return { map: m, mat: ways };
}

/** The menu: a hall with an entrance, a sign, and three doors each with a label sign beside it. */
function menu(book: Book, signs: Record<string, Sign>): StarterMap {
  const g = new Grid(WIDTH_MENU, 15);
  g.row(GROUND, 0, WIDTH_MENU - 1, 'G').fill(0, GROUND + 1, WIDTH_MENU, 4, 'D');
  g.col(0, 0, 9, 'B').col(WIDTH_MENU - 1, 0, 9, 'B');
  g.put(2, 8, 's').put(2, 9, 'S');
  // each door stands on its own ledge of grass over dirt, with a ladder up to it, so walking along
  // the ground never touches a door by accident
  for (const x of MENU_DOORS) {
    g.row(LEDGE_ROW, x - 1, x + 1, 'G').row(LEDGE_ROW + 1, x - 1, x + 1, 'D');
    g.col(x - 2, LEDGE_ROW - 1, GROUND - 1, 'H');
    g.put(x, LEDGE_ROW - 2, 'e').put(x, LEDGE_ROW - 1, 'E');
  }
  for (const [x, y] of [
    [8, 1],
    [18, 2],
    [28, 1],
    [36, 3],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [4, 17, 26, 35]) g.put(x, GROUND - 1, 'b');
  for (const x of [3, 16, 18, 25, 34, 38]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.sign(MENU_INFO_X, onGround(GROUND, signs.menu), signs.menu);
  [signs.one, signs.two, signs.end].forEach((s, i) => m.sign(MENU_LABELS[i], onGround(GROUND, s), s));
  return m;
}

/** The palette, the shared block set (with its timed blocks) and the scenes in order (scene 2 is the first). */
export function buildLevels(): { pal: Pal; book: Book; timed: Timed[]; scenes: Scene[] } {
  const pal = buildStarterPalette();
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  for (const [n, [words, h]] of Object.entries(SIGNS)) signs[n] = addSign(book, pal, `${n}.sign`, words, 4, h);
  const timed: Timed[] = [];
  book.add('trap.shut', trap(pal, false), { solid: SOLID });
  book.add('trap.warn', trap(pal, true), { solid: SOLID });
  book.add('quick.shut', trap(pal, false), { solid: SOLID });
  book.add('quick.warn', trap(pal, true), { solid: SOLID });
  book.add('shaft', shaft(pal), AIR);
  book.add('mat', mat(pal), AIR);
  timed.push({ name: 'trap.shut', next: 'trap.warn', ticks: FLOOR_AT - WARN }, { name: 'trap.warn', next: 'shaft', ticks: WARN });
  timed.push({ name: 'quick.shut', next: 'quick.warn', ticks: QUICK_AT - QUICK_WARN }, { name: 'quick.warn', next: 'shaft', ticks: QUICK_WARN });

  const first = stage(book, signs, 'trap');
  const tale = stage(book, undefined, 'quick');
  const hall = menu(book, signs);
  const back = (mat: [number, number][]): Way[] => mat.map((from) => ({ from, to: 'hall' }));
  const scenes: Scene[] = [
    {
      file: 'one',
      mapFile: 'one',
      title: 'A Scene That Moves On',
      hint: 'Watch, read, then wait.',
      level: true,
      map: first.map,
      before: 'one.lst',
      links: back(first.mat),
    },
    {
      file: 'hall',
      mapFile: 'hall',
      title: 'A Menu Room',
      hint: 'Pick a door.',
      level: true,
      map: hall,
      before: 'hall.lst',
      links: [
        { from: hall.exits[0].from, to: 'tale1' },
        { from: hall.exits[1].from, to: 'tale2' },
        { from: hall.exits[2].from, to: 'end' },
      ],
    },
    { file: 'tale1', mapFile: 'tale', title: 'Tale One', hint: '', level: false, map: tale.map, before: 'tale1.lst', links: back(tale.mat) },
    { file: 'tale2', mapFile: 'tale', title: 'Tale Two', hint: '', level: false, map: tale.map, before: 'tale2.lst', links: back(tale.mat) },
  ];
  return { pal, book, timed, scenes };
}
