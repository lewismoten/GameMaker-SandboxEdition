// THE SHOW's two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts for
// what the letters mean), then given its stage, its signs and its actors.
//
//   1. Curtain Up: two actors wait behind the curtains of a stage near the start. When the level starts
//      their play begins: each peeks out, walks in, says HI in turn and walks off. Every act is a monster
//      that BECOMES the next. The show does not wait for Nova; a door at the start (the encore) loads
//      the level again, which starts the show again.
//   2. Say Hello: a cameo waits in a doorway, walks to the stage, waves HI once and goes off behind the
//      curtain. Once it is gone it is gone, until the encore door.
// Every room is closed in by brick walls you can see, and the actors are not solid, so nothing stops Nova
// that she can't see.
import { SOLID, Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { drawBoards, drawCurtain, drawValance } from './actorArt';
import { CAMEO, MON, WALK } from './monsters';

export type SignName = 'path' | 'start' | 'chain' | 'encore' | 'once' | 'late' | 'exit';

/** The block set both levels share: the Starter blocks, the stage, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  book.add('curtain', drawCurtain(pal), { grav: PULL.down });
  book.add('valance', drawValance(pal), { grav: PULL.down });
  book.add('boards', drawBoards(pal), { solid: SOLID, grav: PULL.down });
  const signs = {
    path: addSign(book, pal, 'path.sign', 'A SCENE IS MONSTERS ON PATHS', 4, 3),
    start: addSign(book, pal, 'start.sign', 'IT STARTS WHEN THE LEVEL DOES', 4, 3),
    chain: addSign(book, pal, 'chain.sign', 'EACH ACT BECOMES THE NEXT ONE', 4, 3),
    encore: addSign(book, pal, 'encore.sign', 'MISSED IT? ← ENCORE DOOR', 4, 3),
    once: addSign(book, pal, 'once.sign', 'A CAMEO SAYS HELLO ONCE', 4, 3),
    late: addSign(book, pal, 'late.sign', 'GONE? IT WILL NOT WAIT', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** Level x of the encore door (it loads this level again). */
  encore: number;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** Where actors and Nova stand: the row above the ground. */
export const STAND = GROUND - 1;

/** A stage: its left and right curtain columns. The boards run between them; the valance runs across the top. */
export interface Stage {
  left: number;
  right: number;
}
export const STAGE_ONE: Stage = { left: 15, right: 26 };
export const STAGE_TWO: Stage = { left: 24, right: 35 };

/** The cameo's doorway column, and where it comes to rest to wave: the doorway less its walk in. */
export const DOORWAY = STAGE_TWO.right + 6;
export const CAMEO_SPOT = DOORWAY - CAMEO.walkIn;
/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number, encoreX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(encoreX, 8, 'e').put(encoreX, 9, 'E');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Builds the stage into the map: boards on the ground row, a curtain up each side and the valance across the top. */
function build(m: StarterMap, s: Stage): void {
  for (let x = s.left + 1; x < s.right; x++) m.set(x, GROUND, 'boards');
  for (let y = 5; y <= STAND; y++) m.set(s.left, y, 'curtain').set(s.right, y, 'curtain');
  for (let x = s.left; x <= s.right; x++) m.set(x, 4, 'valance');
}

/** Level 1: two actors on a stage. 54 blocks wide; the ground is row 10. */
function curtainUp(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(54, 50, 1);
  for (const x of [38, 40, 42, 44, 46]) g.put(x, 9, 'c');
  scenery(
    g,
    [
      [6, 1],
      [12, 2],
      [30, 1],
      [44, 2],
    ],
    [9, 29, 36],
    [11, 33, 47],
  );
  const m = new StarterMap(book, g.rows());
  const s = STAGE_ONE;
  build(m, s);
  m.sign(5, onGround(GROUND, signs.path), signs.path);
  m.sign(10, onGround(GROUND, signs.start), signs.start);
  m.sign(29, onGround(GROUND, signs.chain), signs.chain);
  m.sign(34, onGround(GROUND, signs.encore), signs.encore);
  m.sign(47, onGround(GROUND, signs.exit), signs.exit);
  // the actors wait behind the curtains, peeking
  m.mon(MON.pipPeek, s.left, STAND);
  m.mon(MON.bluPeek, s.right, STAND);
  // the speech bubbles wait over the spots where the actors stop to talk
  m.mon(MON.pipCue, s.left + WALK.blocks, STAND - 1);
  m.mon(MON.bluCue, s.right - WALK.blocks, STAND - 1);
  return m;
}

/** Level 2: one cameo and a doorway. 62 blocks wide. */
function sayHello(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(62, 58, 1);
  for (const x of [44, 46, 48, 50, 52]) g.put(x, 9, 'c');
  scenery(
    g,
    [
      [7, 1],
      [15, 2],
      [40, 1],
      [53, 2],
    ],
    [10, 18, 38, 57],
    [8, 14, 36, 53],
  );
  const m = new StarterMap(book, g.rows());
  const s = STAGE_TWO;
  build(m, s);
  // the doorway the cameo waits in, to the right of the stage
  const doorX = DOORWAY;
  m.set(doorX, 8, 'doorwayTop').set(doorX, 9, 'doorwayBottom');
  m.sign(5, onGround(GROUND, signs.once), signs.once);
  m.sign(12, onGround(GROUND, signs.late), signs.late);
  m.sign(17, onGround(GROUND, signs.encore), signs.encore);
  m.sign(54, onGround(GROUND, signs.exit), signs.exit);
  m.mon(MON.camWait, doorX, STAND);
  m.mon(MON.camCue, doorX - CAMEO.walkIn, STAND - 1);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'scripted');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Curtain Up', hint: 'A play made of acts.', map: curtainUp(book, signs), encore: 1 },
    { file: 'two', title: 'Say Hello', hint: 'It says it once.', map: sayHello(book, signs), encore: 1 },
  ];
  return { book, pal, levels };
}
