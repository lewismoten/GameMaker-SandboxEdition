// PICTURES AND CARTOONS' three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. A Picture First: a picture opens the level (the scene's intro slot) and another comes
//      after it, as the hero leaves by the door (the exit slot).
//   2. A Cartoon Between: nothing before; the exit slot holds a cartoon (an FLI), so it plays
//      between this level and the next.
//   3. Keep It Short: the intro is a list of two pictures; signs say what a cartoon can't do.
// Every room is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** The scene's intro slot (shown before the level) and exit slot (shown when the hero leaves), '' for none. */
  before: string;
  after: string;
}

export const GROUND = 10;
const WIDTH = 46;

/** Each level's signs: [x of the board's left block, words]. The boards are 5 blocks wide and 3 high. */
const SIGNS: Record<string, [number, string][]> = {
  frame: [
    [5, 'A PICTURE CAME UP BEFORE THIS LEVEL'],
    [12, "IT IS THIS SCENE'S INTRO PICTURE"],
    [19, 'A PICTURE IS 320 BY 200 PIXELS'],
    [27, 'THE DOOR SHOWS ANOTHER AFTER THE LEVEL'],
  ],
  cartoon: [
    [5, 'A CARTOON IS AN FLI FILE'],
    [12, 'IT PLAYS LIKE A PICTURE THAT MOVES'],
    [19, 'THE EXIT SLOT PLAYS IT WHEN YOU LEAVE'],
    [27, 'WALK THROUGH THE DOOR TO WATCH IT'],
  ],
  short: [
    [5, 'A LIST SHOWS FILES ONE AFTER ANOTHER'],
    [12, 'THIS LEVEL OPENED WITH TWO PICTURES'],
    [19, 'A CARTOON PLAYS TO ITS LAST FRAME'],
    [27, 'SO KEEP IT SHORT, OR CUT IT INTO CLIPS'],
  ],
};

/** The exit sign's name; its board is 3 blocks wide, one high. */
const EXIT_AT = 38;

function buildBlocks(pal: Pal): { book: Book; signs: Map<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = new Map<string, Sign>();
  for (const [file, list] of Object.entries(SIGNS)) list.forEach(([, words], i) => signs.set(`${file}${i}`, addSign(book, pal, `${file}${i}.sign`, words, 5, 3)));
  signs.set('exit', addSign(book, pal, 'exit.sign', 'EXIT →', 3));
  return { book, signs };
}

const onGround = (s: Sign) => GROUND - 1 - s.board.length;

/** The ground, a hedge at each end (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(exitX: number): Grid {
  const g = new Grid(WIDTH, 15);
  g.row(GROUND, 0, WIDTH - 1, 'G').fill(0, GROUND + 1, WIDTH, 4, 'D');
  g.col(0, 0, 9, 'X').col(WIDTH - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** A level's room: nine coins between the signs, clouds, bushes and flowers, and its signs. */
function room(book: Book, signs: Map<string, Sign>, file: string, exitX: number, clouds: [number, number][], bushes: number[], flowers: number[]): StarterMap {
  const g = base(exitX);
  for (const x of [10, 11, 17, 18, 24, 25, 26, 33, 34]) g.put(x, 9, 'c');
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  SIGNS[file].forEach(([x], i) => m.sign(x, onGround(signs.get(`${file}${i}`)!), signs.get(`${file}${i}`)!));
  m.sign(EXIT_AT, onGround(signs.get('exit')!), signs.get('exit')!);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    {
      file: 'frame',
      title: 'A Picture First',
      hint: 'THIS PICTURE IS A GIF FILE',
      map: room(book, signs, 'frame', 42, [[6, 2], [16, 1], [30, 3], [38, 1]], [13, 22, 31, 40], [14, 21, 36, 41]),
      before: 'frame.lst',
      after: 'post1.lst',
    },
    {
      file: 'cartoon',
      title: 'A Cartoon Between',
      hint: 'A CARTOON PLAYS AFTER THIS ONE',
      map: room(book, signs, 'cartoon', 42, [[7, 1], [20, 2], [33, 1], [39, 3]], [14, 23, 32, 40], [13, 20, 30, 41]),
      before: 'cartoon.lst',
      after: 'bloom.fli',
    },
    {
      file: 'short',
      title: 'Keep It Short',
      hint: 'A CARTOON PLAYS TO THE END',
      map: room(book, signs, 'short', 42, [[8, 2], [18, 1], [29, 2], [37, 3]], [13, 22, 32, 40], [15, 21, 35, 41]),
      before: 'short.lst',
      after: '',
    },
  ];
  return { book, pal, levels };
}
