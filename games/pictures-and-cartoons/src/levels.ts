// PICTURES AND CARTOONS' three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. A Picture First: a picture opens the level (the scene's intro slot) and another comes
//      after it, as the hero leaves by the door (the exit slot).
//   2. A Cartoon Between: nothing before; the exit slot holds a cartoon (an FLI), so it plays
//      between this level and the next.
//   3. Keep It Short: the intro is a list of two pictures; signs say what a cartoon can't do.
// Every room is closed in by hedges you can see, so Yana is never stopped by something she can't.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** Each room allocates only its own sign tiles from the complete vocabulary. */
  book: Book;
  /** The scene's intro slot (shown before the level) and exit slot (shown when the hero leaves), '' for none. */
  before: string;
  after: string;
}

export const GROUND = 10;
const WIDTH = 46;

/** Each level's signs: [x of the board's left block, text lines]. Each room shares its frame and letter tiles. */
const SIGNS: Record<string, [number, string[]][]> = {
  frame: [
    [6, ['A PICTURE', 'CAME UP BEFORE', 'THIS LEVEL']],
    [13, ['ITS SCENE HOLDS THE', 'INTRO PICTURE, A', '320 BY 200 GIF']],
    [27, ['THE DOOR SHOWS', 'ANOTHER AFTER', 'THE LEVEL']],
  ],
  cartoon: [
    [6, ['A CARTOON IS', 'AN FLI FILE', 'THAT MOVES']],
    [13, ['THE EXIT SLOT PLAYS IT', 'WHEN YOU LEAVE']],
    [27, ['WALK THROUGH', 'THE DOOR', 'TO WATCH IT']],
  ],
  short: [
    [4, ['A LIST SHOWS', 'TWO PICTURES,', 'ONE AFTER ANOTHER']],
    [13, ['A CARTOON PLAYS', 'TO ITS LAST FRAME']],
    [26, ['SO KEEP IT SHORT,', 'OR CUT IT', 'INTO CLIPS']],
  ],
};

/** The exit board stands clear of the flower and bush beside the door. */
const EXIT_AT = 37;

function buildBlocks(pal: Pal, file: string): { book: Book; signs: Map<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const texts = Object.fromEntries(
    Object.entries(SIGNS).flatMap(([level, list]) => list.map(([, rows], i) => [`${level}${i}`, { rows: rows.map((line) => [line]) }])),
  );
  texts.exit = { rows: [['EXIT →']] };
  const tiled = buildTiledSigns(texts, {
    colors: {
      background: skyOf(pal),
      paper: pal.c('parch', 3),
      ink: pal.c('ink', 0),
      wood: pal.c('wood', 2),
      highlight: pal.c('wood', 4),
      shadow: pal.c('wood', 0),
    },
    include: [...SIGNS[file].map((_, i) => `${file}${i}`), 'exit'],
    lettersPerBlock: 3,
    glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' },
    maxBlocks: Math.min(100, 150 - book.index.size),
  });
  for (const [name, pic] of tiled.blocks) book.add(name, pic, { grav: PULL.down });
  const signs = new Map(Object.entries(tiled.signs));
  return { book, signs };
}

const onGround = (s: Sign) => GROUND - 1 - s.board.length;

/** The ground, a hedge at each end (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(exitX: number): Grid {
  const g = new Grid(WIDTH, 15);
  g.row(GROUND, 0, WIDTH - 1, 'G').fill(0, GROUND + 1, WIDTH, 4, 'D');
  g.col(0, 0, 9, 'X').col(WIDTH - 1, 0, 9, 'X');
  // A two-row turf ledge opens on more sky, clear of every lesson board.
  g.put(3, 8, 'G').put(3, 9, 'D');
  g.put(3, 6, 's').put(3, 7, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** A level's room: nine coins between the signs, clouds, bushes and flowers, and its signs. */
function room(book: Book, signs: Map<string, Sign>, file: string, exitX: number, clouds: [number, number][], bushes: number[], flowers: number[]): StarterMap {
  const g = base(exitX);
  const spots = [11, 12, 13, 20, 21, 22, 23, 33, 34];
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes.filter((b) => !spots.includes(b))) g.put(x, GROUND - 1, 'b');
  for (const x of flowers.filter((f) => !spots.includes(f))) g.put(x, GROUND - 1, 'f');
  for (const x of spots) g.put(x, GROUND - 1, 'c');
  const m = new StarterMap(book, g.rows());
  const safe = { set: (x: number, y: number, block: string) => m.setOnSky(x, y, block) };
  SIGNS[file].forEach(([x], i) => {
    const sign = signs.get(`${file}${i}`)!;
    stampTiledSign(safe, x, onGround(sign), sign);
  });
  stampTiledSign(safe, EXIT_AT, onGround(signs.get('exit')!), signs.get('exit')!);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'pictures-and-cartoons');
  const sets = Object.fromEntries(Object.keys(SIGNS).map((file) => [file, buildBlocks(pal, file)]));
  const { book } = sets.frame;
  const levels: Level[] = [
    {
      file: 'frame',
      book: sets.frame.book,
      title: 'A Picture First',
      hint: 'THIS PICTURE IS A GIF FILE',
      map: room(
        sets.frame.book,
        sets.frame.signs,
        'frame',
        42,
        [
          [6, 2],
          [16, 1],
          [30, 3],
          [38, 1],
        ],
        [13, 24, 31, 40],
        [10, 19, 36, 41],
      ),
      before: 'frame.lst',
      after: 'post1.lst',
    },
    {
      file: 'cartoon',
      book: sets.cartoon.book,
      title: 'A Cartoon Between',
      hint: 'A CARTOON PLAYS AFTER THIS ONE',
      map: room(
        sets.cartoon.book,
        sets.cartoon.signs,
        'cartoon',
        42,
        [
          [7, 1],
          [20, 2],
          [33, 1],
          [39, 3],
        ],
        [13, 25, 32, 40],
        [10, 19, 36, 41],
      ),
      before: 'cartoon.lst',
      after: 'bloom.fli',
    },
    {
      file: 'short',
      book: sets.short.book,
      title: 'Keep It Short',
      hint: 'A CARTOON PLAYS TO THE END',
      map: room(
        sets.short.book,
        sets.short.signs,
        'short',
        42,
        [
          [8, 2],
          [18, 1],
          [29, 2],
          [37, 3],
        ],
        [13, 25, 32, 40],
        [10, 19, 36, 41],
      ),
      before: 'short.lst',
      after: '',
    },
  ];
  return { book, pal, levels };
}
