// STICK MAN STARS' four levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. Stargazing Hill (night): Stick Man picks bright stars out of the sky (Space jumps to the high ones). They are what he throws.
//   2. Main Street (dawn): learn Enter. Two cottages, one too far for a first throw; then a solid shed
//      fills a brick tunnel, and the way opens when a star lights it.
//   3. Shy Street (day): the towers wander up and down the street. Wait, aim, throw. A shed again.
//   4. Spam Row (dusk): spam bots roll and bump, then the Big Repo, a shed that takes three stars, and the lit street beyond.
// Every room is closed in by brick walls you can see, so Stick Man is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { smallSign, stampSign, type SmallSign as Sign } from './signs';
import { BIG3, BOT, COTTAGE, FORK_COT, FORK_TOW, LIT_COT, LIT_TOW, OLD_BIG, SHED, TOWER } from './monsters';
import { addPencilScenery } from './pencilArt';
import { addNightBlocks } from './nightSky';
import { addPickStar, addStarGate } from './pickStar';
import { paintNight } from './nightSky';
import { paletteFor, type Mood, type PaperKind } from './moods';
import { FORK, addPaperBlocks, hidePaper, hillAt, hillPastEdges, paperRamps, paperize, pencilAt, seamAt } from './paper';

/** The signs the levels use, by name. */
export type SignName = 'thx' | 'readme' | 'fake' | 'gaze' | 'gate' | 'how' | 'far' | 'shed' | 'shy' | 'bots' | 'three' | 'thanks' | 'forked' | 'exit';
/** Repo names that go over a house's door (six letters fit). */
const NAMES = ['SOCKS', 'SOUP', 'TEAPOT', 'MOTHS', 'PIE', 'KEYS'] as const;
type Name = (typeof NAMES)[number];

/** The Starter blocks this game places (the rest of the kit's set stays out, to leave room for its own art). */
const STARTER_KEEP = ['sky', 'brick', 'doorTop', 'doorBottom', 'doorwayTop', 'doorwayBottom', 'coin'];
/** The block set every level shares: the Starter blocks it uses, its own art, the paper, then the signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign>; names: Record<Name, Sign> } {
  const kit = new Book('bbl');
  addStarterBlocks(kit, pal);
  const book = new Book('bbl');
  for (const n of STARTER_KEEP) book.add(n, kit.pics.get(n)!, kit.rulesOf(n));
  addPencilScenery(book, pal);
  addPickStar(book, pal);
  addStarGate(book, pal);
  addNightBlocks(book, pal);
  addPaperBlocks(book, pal);
  // the wording is cut in chunks of five letters, and a chunk two signs share is one block (signs.ts)
  const sign = (chunks: string): Sign => smallSign(book, pal, chunks);
  const signs = {
    gaze: sign('SPACE|: JUM|P UP!'),
    gate: sign('FIVE |STARS| OPEN| THE |GATE.'),
    how: sign('ENTER|: THR|OW A |STAR!'),
    far: sign('STARS| ONLY| GO S|O FAR'),
    shed: sign('SHEDS| NAP |HERE.'),
    shy: sign('SHY O|NES W|ANDER'),
    bots: sign('SPAM |BOTS |BUMP.| POP |THEM!'),
    three: sign('3 LAM|PS: O|NE TH|ANKS |EACH!'),
    thanks: sign('LIKED| IT? |STAR!'),
    // over the old original the Big Repo was forked from: a name board, resting on its roof
    forked: smallSign(book, pal, ' THE |ORIGI|NAL  ', false),
    thx: sign('A STA|R: TH|ANKS!'),
    readme: sign('SAYS |WHAT |IT IS'),
    fake: sign('FAKE |STARS| FADE'),
    exit: sign('EXIT→'),
  };
  const names = {} as Record<Name, Sign>;
  for (const n of NAMES)
    names[n] = smallSign(
      book,
      pal,
      n.length > 5 ? `  ${n.slice(0, 3)}|${n.slice(3)}  ` : n.padStart(n.length + Math.floor((5 - n.length) / 2)).padEnd(5),
      false,
    );
  paperize(book, pal);
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
  /** Drawn on paper, with no climbing: its scene never scrolls up or down (game.ts). */
  flat: boolean;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number) => ground - 2;

export const GROUND = 10;
/** Where the monsters stand: the row above the ground. */
export const STAND = GROUND - 1;

/** The ground, brick walls at both ends, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  // a brick ceiling: Space can be pressed in the air again and again, so without it he climbs out over the walls and the tunnels
  g.row(0, 0, width - 1, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** A brick tunnel two blocks high (rows 8 and 9) from x0 to x1: a gate house in it can't be stepped around or jumped. */
function tunnel(g: Grid, x0: number, x1: number): void {
  g.fill(x0, 0, x1 - x0 + 1, 8, 'B');
}

function scenery(g: Grid, clouds: number[], bushes: number[], flowers: number[]): void {
  // rows 4 and 5: the screen shows four rows over his head when he stands (the camera keeps his feet 120 px down)
  clouds.forEach((x, i) => g.put(x, 4 + (i % 2), '(').put(x + 1, 4 + (i % 2), ')'));
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

type World = { book: Book; signs: Record<SignName, Sign>; names: Record<Name, Sign> };

/** Stamps sign `s` at block x, standing on the ground. */
/** Where each level's signs stand, for tools/layoutCheck.ts: block rectangles (the board and its legs row). */
export const PLACED = new WeakMap<StarterMap, { what: string; x: number; y: number; w: number; h: number }[]>();
function note(m: StarterMap, what: string, x: number, y: number, s: Sign): void {
  const posts = s.posts.map(([dx]) => ({ what: `${what} post`, x: x + dx, y: y + 1, w: 1, h: 1 }));
  PLACED.set(m, [...(PLACED.get(m) ?? []), { what, x, y, w: s.board.length, h: 1 }, ...posts]);
}
const signAt = (m: StarterMap, w: World, x: number, which: SignName) => {
  note(m, which, x, onGround(GROUND), w.signs[which]);
  stampSign(m, x, onGround(GROUND), w.signs[which]);
};
/** A house with its name over the door (the name board is three wide, the house in the middle). */
function named(m: StarterMap, w: World, kind: number, x: number, name: Name): void {
  // a five-letter name is one block over the house; a longer one is two, the house under their middle
  const at = x - Math.floor(w.names[name].board.length / 2);
  note(m, `name ${name}`, at, STAND - 1, w.names[name]);
  stampSign(m, at, STAND - 1, w.names[name]);
  m.mon(kind, x, STAND);
}

/** Level 1: a night hill with a starfield, and bright stars (hung from a walk to a jump high) to pick. The town gate wants five. */
export const L0 = {
  walk: [20, 24, 40] as const,
  jump: [17, 28, 33, 37, 44, 48] as const,
  gate: 52,
  tunnel: [50, 54] as const,
  exit: 57,
  width: 61,
  need: 5,
  ceiling: 3,
  seams: [1, 15, 38] as const,
};
function stargazingHill(w: World): StarterMap {
  const g = base(L0.width, L0.exit);
  tunnel(g, L0.tunnel[0], L0.tunnel[1]);
  // the screen never scrolls up or down here (game.ts), so the brick ceiling comes down to row 3, just above
  // the top of the screen: however often Space is pressed in the air, Stick Man stays in sight
  g.fill(1, 0, L0.width - 2, L0.ceiling + 1, 'B');
  for (const x of [24, 42]) g.put(x, GROUND - 1, 'b');
  const m = new StarterMap(w.book, g.rows());
  paintNight(m, L0.width, L0.tunnel, L0.ceiling + 1);
  signAt(m, w, 5, 'gaze');
  signAt(m, w, 43, 'gate');
  // on white notebook paper: the hill drawn in pencil, giant pencils for the end walls (their tips just under
  // the ceiling), and three sheets taped edge to edge, each with its own binder holes and margin
  hillAt(m, 0, L0.width - 1, GROUND, GROUND + 4);
  hillPastEdges(m, w.book);
  for (const x of [0, L0.width - 1]) pencilAt(m, x, L0.ceiling + 1, STAND);
  for (const x of L0.seams) seamAt(m, x, L0.ceiling + 1, GROUND, GROUND + 4);
  m.set(L0.gate, STAND - 1, 'stargateTop').set(L0.gate, STAND, 'stargate');
  for (const x of L0.walk) m.set(x, 8, 'pickstar');
  const rows = [7, 6, 5, 6, 7, 5];
  L0.jump.forEach((x, i) => m.set(x, rows[i], 'pickstar'));
  return m;
}

/** Where level 1's houses and gate stand (block x). */
export const L1 = { fork: 24, bonus: 53, cottages: [17, 34, 55] as const, tunnel: [42, 49] as const, gate: 46, exit: 60, width: 64 };
function mainStreet(w: World): StarterMap {
  const g = base(L1.width, L1.exit);
  tunnel(g, L1.tunnel[0], L1.tunnel[1]);
  g.row(9, 10, 12, 'c').row(8, 24, 27, 'c').row(9, 28, 28, 'c').row(9, 38, 40, 'c').row(9, 49, 51, 'c');
  scenery(g, [8, 22, 36, 50], [14, 30, 44, 58], [11, 26, 38, 52]);
  const m = new StarterMap(w.book, g.rows());
  signAt(m, w, 5, 'how');
  signAt(m, w, 11, 'thx');
  signAt(m, w, 19, 'far');
  signAt(m, w, 28, 'readme');
  signAt(m, w, 36, 'shed');
  signAt(m, w, 57, 'exit');
  named(m, w, COTTAGE, L1.cottages[0], 'SOCKS');
  named(m, w, COTTAGE, L1.cottages[1], 'SOUP');
  named(m, w, COTTAGE, L1.cottages[2], 'TEAPOT');
  // a giant silver fork lies on the sheet: he hops onto it, takes the coins along it, and hops down
  FORK.forEach((name, i) => m.set(L1.fork + i, STAND, name));
  m.set(L1.bonus, 5, 'pickstar');
  m.mon(SHED, L1.gate, STAND);
  return m;
}

/** Level 2: three shy towers (each walks 5 blocks from where it starts), a cottage, and a shed in a tunnel. */
export const L2 = { bonus: 48, towers: [20, 32, 44] as const, cottage: 56, tunnel: [60, 67] as const, gate: 64, rest: [71, 80] as const, exit: 84, width: 88 };
function shyStreet(w: World): StarterMap {
  const g = base(L2.width, L2.exit);
  tunnel(g, L2.tunnel[0], L2.tunnel[1]);
  g.row(9, 10, 14, 'c').row(9, 27, 29, 'c').row(9, 40, 42, 'c').row(9, 50, 52, 'c').row(9, 69, 70, 'c');
  scenery(g, [7, 18, 30, 42, 54, 73], [12, 25, 38, 51, 62, 72, 79], [9, 17, 35, 48, 58, 75, 80]);
  const m = new StarterMap(w.book, g.rows());
  signAt(m, w, 5, 'shy');
  signAt(m, w, 50, 'shed');
  signAt(m, w, 81, 'exit');
  for (const x of L2.towers) m.mon(TOWER, x, STAND);
  named(m, w, COTTAGE, L2.cottage, 'MOTHS');
  m.set(L2.bonus, 5, 'pickstar');
  m.mon(SHED, L2.gate, STAND);
  // A safe garden after the last task, before Spam Row: no pickups, hazards or timer.
  // The already-lit, passable houses are company, not another aiming test. Stay or walk on.
  // Each has a fork beside it: a smaller copy with a fork for a weathervane.
  m.mon(LIT_COT, 73, STAND).mon(FORK_COT, 74, STAND).mon(LIT_TOW, 77, STAND).mon(FORK_TOW, 78, STAND);
  return m;
}

/** Level 4: a cottage, a tower, a bot, a cottage, a bot, then the Big Repo (a fork) in its tunnel, and the lit street with its old original. */
export const L4 = { bonus: 44, cottages: [14, 40] as const, tower: 24, bots: [32, 47] as const, tunnel: [52, 59] as const, gate: 56, exit: 74, width: 78 };
function starCount(w: World): StarterMap {
  const g = base(L4.width, L4.exit);
  tunnel(g, L4.tunnel[0], L4.tunnel[1]);
  g.row(9, 9, 11, 'c').row(9, 18, 20, 'c').row(9, 28, 30, 'c').row(9, 43, 45, 'c').row(9, 71, 72, 'c');
  scenery(g, [6, 16, 28, 40, 52, 62], [12, 22, 36, 49, 60], [8, 16, 27, 44, 64]);
  const m = new StarterMap(w.book, g.rows());
  signAt(m, w, 5, 'bots');
  signAt(m, w, 29, 'fake');
  signAt(m, w, 48, 'three');
  signAt(m, w, 60, 'thanks');
  named(m, w, COTTAGE, L4.cottages[0], 'KEYS');
  m.mon(TOWER, L4.tower, STAND);
  for (const x of L4.bots) m.mon(BOT, x, STAND);
  named(m, w, COTTAGE, L4.cottages[1], 'PIE');
  m.mon(BIG3, L4.gate, STAND);
  m.set(L4.bonus, 5, 'pickstar');
  // the street past the Big Repo is already lit, and waves: a cottage and its fork, then the old original the Big Repo was forked from
  m.mon(LIT_COT, 65, STAND).mon(FORK_COT, 66, STAND).mon(OLD_BIG, 70, STAND).mon(LIT_TOW, 73, STAND);
  note(m, 'forked', 68, STAND - 1, w.signs.forked);
  stampSign(m, 68, STAND - 1, w.signs.forked);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(paperRamps, 'stick-man-stars');
  hidePaper(pal.pal, skyOf(pal), pal.r('paper'));
  const w = buildBlocks(pal);
  const level = (file: string, title: string, hint: string, mood: Mood, map: StarterMap, paper: PaperKind, flat = false): Level => ({
    file,
    title,
    hint,
    mood,
    map,
    pal: paletteFor(pal, mood, paper),
    flat,
  });
  const levels: Level[] = [
    level('one', 'Stargazing Hill', 'Pick the bright stars.', 'night', stargazingHill(w), 'notebook', true),
    level('two', 'Main Street', 'Enter throws a star.', 'dawn', mainStreet(w), 'graph'),
    level('three', 'Shy Street', 'Houses wander. Wait and aim.', 'day', shyStreet(w), 'postit'),
    level('four', 'Spam Row', 'Pop the bots. Light three lanterns.', 'dusk', starCount(w), 'construction'),
  ];
  return { book: w.book, pal, levels };
}
