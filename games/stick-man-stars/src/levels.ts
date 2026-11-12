// STICK MAN STARS' four levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. Stargazing Hill (night): Stick Man picks bright stars out of the sky (Up jumps to the high ones). They are what he throws.
//   2. Main Street (dawn): learn Space. Two cottages, one too far for a first throw; then a solid shed
//      fills a brick tunnel, and the way opens when a star lights it.
//   3. Shy Street (day): the towers wander up and down the street. Wait, aim, throw. A shed again.
//   4. Spam Row (dusk): spam bots roll and bump, then the Big Repo, a shed that takes three stars, and the lit street beyond.
// Every room is closed in by brick walls you can see, so Stick Man is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BIG3, BOT, COTTAGE, LIT_COT, LIT_SHED, LIT_TOW, SHED, TOWER } from './monsters';
import { addPickStar } from './pickStar';
import { paletteFor, type Mood } from './moods';

/** The signs the levels use, by name. */
export type SignName = 'gaze' | 'how' | 'far' | 'shed' | 'shy' | 'bots' | 'three' | 'thanks' | 'exit';
/** Repo names that go over a house's door (six letters fit). */
const NAMES = ['SOCKS', 'SOUP', 'TEAPOT', 'MOTHS', 'NAPS', 'PUNS', 'PIE', 'KEYS'] as const;
type Name = (typeof NAMES)[number];

/** The block set every level shares: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign>; names: Record<Name, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addPickStar(book, pal);
  const signs = {
    gaze: addSign(book, pal, 'gaze', 'JUMP WITH UP TO PICK STARS', 4, 2),
    how: addSign(book, pal, 'how', 'SPACE THROWS A STAR', 4, 2),
    far: addSign(book, pal, 'far', 'A STAR FLIES ONLY SO FAR', 4, 2),
    shed: addSign(book, pal, 'shed', 'A SHY SHED BLOCKS THE WAY', 4, 2),
    shy: addSign(book, pal, 'shy', 'SHY ONES WANDER', 4, 2),
    bots: addSign(book, pal, 'bots', 'SPAM BOTS BUMP. POP THEM', 4, 2),
    three: addSign(book, pal, 'three', 'THE BIG REPO WANTS 3 STARS', 4, 2),
    thanks: addSign(book, pal, 'thanks', 'THANK YOU STAR GAZERS', 4, 2),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
  };
  const names = {} as Record<Name, Sign>;
  for (const n of NAMES) names[n] = addSign(book, pal, `n.${n}`, n, 3, 1);
  return { book, signs, names };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  mood: Mood;
  map: StarterMap;
  /** This level's palette: the shared one with its sky (and grass) swapped. */
  pal: Pal;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** Where the monsters stand: the row above the ground. */
export const STAND = GROUND - 1;

/** The ground, brick walls at both ends, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** A brick tunnel two blocks high (rows 8 and 9) from x0 to x1: a gate house in it can't be stepped around or jumped. */
function tunnel(g: Grid, x0: number, x1: number): void {
  g.fill(x0, 0, x1 - x0 + 1, 8, 'B');
}

function scenery(g: Grid, clouds: number[], bushes: number[], flowers: number[]): void {
  clouds.forEach((x, i) => g.put(x, 1 + ((i * 2) % 4), '(').put(x + 1, 1 + ((i * 2) % 4), ')'));
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

type World = { book: Book; signs: Record<SignName, Sign>; names: Record<Name, Sign> };

/** Stamps sign `s` at block x, standing on the ground. */
const signAt = (m: StarterMap, w: World, x: number, which: SignName) => m.sign(x, onGround(GROUND, w.signs[which]), w.signs[which]);
/** A house with its name over the door (the name board is three wide, the house in the middle). */
function named(m: StarterMap, w: World, kind: number, x: number, name: Name): void {
  m.sign(x - 1, STAND - 1, w.names[name]);
  m.mon(kind, x, STAND);
}

/** Level 1: a night hill, and bright stars (hung at heights from a walk to a jump) to pick before the door. */
export const L0 = { walk: [14, 22, 40] as const, jump: [18, 26, 31, 36, 44, 48] as const, exit: 56, width: 60 };
function stargazingHill(w: World): StarterMap {
  const g = base(L0.width, L0.exit);
  scenery(g, [4, 20, 38, 52], [10, 24, 42], [7, 29, 47, 54]);
  const m = new StarterMap(w.book, g.rows());
  signAt(m, w, 5, 'gaze');
  signAt(m, w, 51, 'exit');
  for (const x of L0.walk) m.set(x, 8, 'pickstar');
  const rows = [7, 6, 5, 6, 7, 5];
  L0.jump.forEach((x, i) => m.set(x, rows[i], 'pickstar'));
  return m;
}

/** Where level 1's houses and gate stand (block x). */
export const L1 = { cottages: [17, 34, 55] as const, tunnel: [42, 49] as const, gate: 46, exit: 60, width: 64 };
function mainStreet(w: World): StarterMap {
  const g = base(L1.width, L1.exit);
  tunnel(g, L1.tunnel[0], L1.tunnel[1]);
  g.row(9, 10, 12, 'c').row(9, 24, 28, 'c').row(9, 38, 40, 'c').row(9, 49, 51, 'c');
  scenery(g, [8, 22, 36, 50], [14, 30, 44, 58], [11, 26, 38, 52]);
  const m = new StarterMap(w.book, g.rows());
  signAt(m, w, 5, 'how');
  signAt(m, w, 22, 'far');
  signAt(m, w, 37, 'shed');
  signAt(m, w, 56, 'exit');
  named(m, w, COTTAGE, L1.cottages[0], 'SOCKS');
  named(m, w, COTTAGE, L1.cottages[1], 'SOUP');
  named(m, w, COTTAGE, L1.cottages[2], 'TEAPOT');
  m.mon(SHED, L1.gate, STAND);
  return m;
}

/** Level 2: three shy towers (each walks 5 blocks from where it starts), a cottage, and a shed in a tunnel. */
export const L2 = { towers: [20, 32, 44] as const, cottage: 56, tunnel: [60, 67] as const, gate: 64, exit: 72, width: 76 };
function shyStreet(w: World): StarterMap {
  const g = base(L2.width, L2.exit);
  tunnel(g, L2.tunnel[0], L2.tunnel[1]);
  g.row(9, 10, 14, 'c').row(9, 27, 29, 'c').row(9, 40, 42, 'c').row(9, 50, 52, 'c').row(9, 69, 70, 'c');
  scenery(g, [7, 18, 30, 42, 54, 66], [12, 25, 38, 51, 62], [9, 17, 35, 48, 58]);
  const m = new StarterMap(w.book, g.rows());
  signAt(m, w, 5, 'shy');
  signAt(m, w, 57 - 5, 'shed');
  signAt(m, w, 68, 'exit');
  for (const x of L2.towers) m.mon(TOWER, x, STAND);
  named(m, w, COTTAGE, L2.cottage, 'MOTHS');
  m.mon(SHED, L2.gate, STAND);
  return m;
}

/** Level 4: a cottage, a tower, a bot, a cottage, a bot, then the Big Repo in its tunnel and the lit street. */
export const L4 = { cottages: [14, 40] as const, tower: 24, bots: [32, 47] as const, tunnel: [52, 59] as const, gate: 56, exit: 74, width: 78 };
function starCount(w: World): StarterMap {
  const g = base(L4.width, L4.exit);
  tunnel(g, L4.tunnel[0], L4.tunnel[1]);
  g.row(9, 9, 11, 'c').row(9, 18, 20, 'c').row(9, 28, 30, 'c').row(9, 43, 45, 'c').row(9, 71, 72, 'c');
  scenery(g, [6, 16, 28, 40, 52, 62], [12, 22, 36, 49, 60], [8, 16, 27, 44, 64]);
  const m = new StarterMap(w.book, g.rows());
  signAt(m, w, 5, 'bots');
  signAt(m, w, 48, 'three');
  signAt(m, w, 60, 'thanks');
  named(m, w, COTTAGE, L4.cottages[0], 'KEYS');
  m.mon(TOWER, L4.tower, STAND);
  for (const x of L4.bots) m.mon(BOT, x, STAND);
  named(m, w, COTTAGE, L4.cottages[1], 'PIE');
  m.mon(BIG3, L4.gate, STAND);
  // the street past the Big Repo is already lit, and waves
  m.mon(LIT_COT, 65, STAND).mon(LIT_TOW, 67, STAND).mon(LIT_SHED, 69, STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'stick-man-stars');
  const w = buildBlocks(pal);
  const level = (file: string, title: string, hint: string, mood: Mood, map: StarterMap): Level => ({
    file,
    title,
    hint,
    mood,
    map,
    pal: paletteFor(pal, mood),
  });
  const levels: Level[] = [
    level('one', 'Stargazing Hill', 'Pick the bright stars.', 'night', stargazingHill(w)),
    level('two', 'Main Street', 'Space throws a star.', 'dawn', mainStreet(w)),
    level('three', 'Shy Street', 'Houses wander. Wait and aim.', 'day', shyStreet(w)),
    level('four', 'Spam Row', 'Pop the bots. Light the Big Repo.', 'dusk', starCount(w)),
  ];
  return { book: w.book, pal, levels };
}
