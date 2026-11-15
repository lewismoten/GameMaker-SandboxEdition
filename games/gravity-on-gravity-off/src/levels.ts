// GRAVITY ON, GRAVITY OFF's two levels: one scene, drawn twice. A wall, a ledge with five coins, bushes and an
// exit door, first from the side (gravity pulls Rima down: jump the wall, walk off the ledge and fall) and then
// from above (nothing pulls her: walk around the wall, step off the deck and nothing happens).
//
//   1. Gravity On:  side.bbl, every air block has Gravity "down".
//   2. Gravity Off: top.bbl, every block has Gravity "none", and top.chr walks in four directions.
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addTopBlocks } from './topBlocks';
import { TopMap } from './topMap';

export type SignName = 'jump' | 'wall' | 'ledge' | 'exit';

/** The signs' words in both levels (the same four ideas, said for each view). */
const WORDS: Record<'side' | 'top', Record<SignName, string>> = {
  side: {
    jump: 'GRAVITY IS ON. SPACE JUMPS AND YOU FALL BACK',
    wall: 'A WALL IS A STEP. JUMP OVER IT',
    ledge: 'WALK OFF THE LEDGE AND GRAVITY PULLS YOU DOWN',
    exit: 'EXIT →',
  },
  top: {
    jump: 'GRAVITY IS OFF. THE ARROWS WALK IN FOUR WAYS',
    wall: 'SPACE DOES NOTHING NOW. WALK AROUND THE WALL',
    ledge: 'WALK OFF THE DECK. NOTHING PULLS YOU DOWN',
    exit: 'EXIT →',
  },
};

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** The block set this level's map is drawn with. */
  book: Book;
  map: { start: [number, number]; exits: { from: [number, number] }[]; width: number; height: number; done(): ReturnType<StarterMap['done']> };
}

export const GROUND = 10;
/** The wall, the ledge and the coins, the same blocks across in both levels. */
export const WALL_X = 14;
export const LEDGE_X = [20, 24] as const;
export const EXIT_X = 36;
/** Level 2's rows: the path runs along PATH_Y, the wall hangs from the top hedge to WALL_BOTTOM, and the way around runs along ROUND_Y. */
export const PATH_Y = 5;
export const WALL_BOTTOM = 6;
export const ROUND_Y = 8;
export const TOP_HEIGHT = 11;

/** Each narrow room shares its frame, letter fragments and single post. */
function compactSigns(book: Book, pal: Pal, view: 'side' | 'top', lawn?: Pixels): Record<SignName, Sign> {
  const texts = Object.fromEntries(
    (Object.keys(WORDS[view]) as SignName[]).map((name) => [name, { rows: [[WORDS[view][name]]], maxWidth: name === 'wall' ? 5 : 7 }]),
  ) as Record<SignName, { rows: string[][]; maxWidth: number }>;
  const { blocks, signs } = buildTiledSigns(texts, {
    compact: true,
    colors: {
      background: skyOf(pal),
      paper: pal.c('parch', 3),
      ink: pal.c('ink', 0),
      wood: pal.c('wood', 2),
      highlight: pal.c('wood', 4),
      shadow: pal.c('wood', 0),
    },
    glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' },
    maxBlocks: 100 - book.index.size,
  });
  for (const [name, pic] of blocks)
    book.add(name, lawn ? pic.map((x, y, c) => (c === skyOf(pal) ? lawn.get(x, y) : c)) : pic, { grav: view === 'side' ? PULL.down : PULL.none });
  return signs;
}

/** Level 1: a side view, 40 blocks wide. */
function sideLevel(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(40, 15);
  g.row(GROUND, 0, 39, 'G').fill(0, GROUND + 1, 40, 4, 'D');
  g.col(0, 0, 9, 'X').col(39, 0, 9, 'X');
  // A two-column turf step supports the hero beside the readable entrance door.
  g.put(3, 6, 's').put(3, 7, 'S').row(8, 3, 4, 'G').row(9, 3, 4, 'D').put(EXIT_X, 8, 'e').put(EXIT_X, 9, 'E');
  g.col(WALL_X, 8, 9, 'B'); // the wall: two blocks high, a jump clears it
  g.row(8, LEDGE_X[0], LEDGE_X[1], '='); // the ledge
  g.row(7, LEDGE_X[0], LEDGE_X[1], 'c'); // its five coins
  for (const [x, y] of [
    [6, 2],
    [19, 1],
    [31, 3],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [21, 28, 34]) g.put(x, GROUND - 1, 'b');
  for (const x of [10, 17, 30]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.start[0] += 1; // Stand beside the door, on the right half of the step.
  // The first board hangs above the raised entrance, without covering the door.
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, 1, 3, signs.jump, GROUND - 2 - 3 - signs.jump.board.length);
  stampTiledSign(m, 8, 5, signs.wall);
  stampTiledSign(m, 25, 5, signs.ledge);
  stampTiledSign(m, 34, 5, signs.exit);
  return m;
}

/** Level 2: the same scene from above, 40 blocks wide and 11 high. */
function topLevel(book: Book, signs: Record<SignName, Sign>): TopMap {
  const g = new Grid(40, TOP_HEIGHT);
  g.row(0, 0, 39, 'X')
    .row(TOP_HEIGHT - 1, 0, 39, 'X')
    .col(0, 0, TOP_HEIGHT - 1, 'X')
    .col(39, 0, TOP_HEIGHT - 1, 'X');
  // the path: along the room, down and round the wall, and on
  g.row(PATH_Y, 4, 12, 'G').col(12, PATH_Y, ROUND_Y, 'G').row(ROUND_Y, 12, 16, 'G').col(16, PATH_Y, ROUND_Y, 'G').row(PATH_Y, 16, 36, 'G');
  g.col(WALL_X, 1, WALL_BOTTOM, 'W');
  g.fill(LEDGE_X[0], 3, LEDGE_X[1] - LEDGE_X[0] + 1, 3, '='); // the deck
  g.row(4, LEDGE_X[0], LEDGE_X[1], 'c');
  g.put(3, PATH_Y - 1, 's')
    .put(3, PATH_Y, 'S')
    .put(EXIT_X, PATH_Y - 1, 'e')
    .put(EXIT_X, PATH_Y, 'E');
  for (const x of [21, 28, 34]) g.put(x, ROUND_Y, 'b');
  for (const x of [10, 17, 30]) g.put(x, ROUND_Y + 1, 'f');
  const m = new TopMap(book, g.rows());
  stampTiledSign(m, 1, 1, signs.jump);
  stampTiledSign(m, 8, 1, signs.wall);
  stampTiledSign(m, 25, 1, signs.ledge);
  stampTiledSign(m, 34, 2, signs.exit);
  return m;
}

/** Both levels, the side view's block set (`book`) and the top view's (`topBook`). */
export function buildLevels(): { book: Book; topBook: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'gravity-on-gravity-off');
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const side = compactSigns(book, pal, 'side');
  const topBook = new Book('bbl');
  const lawn = addTopBlocks(topBook, pal, book);
  const top = compactSigns(topBook, pal, 'top', lawn);
  const levels: Level[] = [
    { file: 'one', title: 'Gravity On', hint: 'Jump, and fall back down.', book, map: sideLevel(book, side) },
    { file: 'two', title: 'Gravity Off', hint: 'The same place, from above.', book: topBook, map: topLevel(topBook, top) },
  ];
  return { book, topBook, pal, levels };
}
