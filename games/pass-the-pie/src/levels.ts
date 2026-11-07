// PASS THE PIE's six levels. Each is painted on a Grid (a block a character, games/kit/starter/map.ts says what the
// letters mean), then given its own blocks, signs and monsters. Every level has its own block set and its own palette
// mood (palette.ts), so the levels look different, and each has the same job: pick up the dish at the start (a counter,
// like a key), cross the level and hand it over at the neighbor's door (a gate that wants the dish).
//
//   1. Pumpkin Yard   leaf piles that hide snacks, fences to hop, friendly squirrels      (the pie)
//   2. Gravy Slide    a kitchen floor with robot vacuums: every bump spills the gravy      (the gravy boat)
//   3. Windy Park     a backyard football game in the way: bobbing footballs               (the casserole)
//   4. Cranberry Roll the sauce rolls out of its can and bounces off the pillars           (the cranberry sauce)
//   5. Hungry Dog     the dog wants the rolls: fetch his bone from the high shelf first    (the rolls)
//   6. Parade Dash    the rolls are getting cold: a bar of rolls cools, the town hall doors shut (the rolls again)
//
// Every room is closed in by hedges you can see, so Rory is never stopped by something he can't.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks, KEYS } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks, SILVER_KEYS } from '../../kit/starter/locks';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { addSign, type Sign } from '../../kit/starter/sign';
import type { Pal } from '../../kit/starter/palette';
import * as art from './art';
import { MONS } from './monsters';
import type { Mood } from './palette';
import { BAR_ROW, BAR_X, HALL_OPEN, SEG_TICKS, SEG_WARN } from './timing';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  mood: Mood;
  /** The song file this level plays. */
  song: string;
  book: Book;
  map: StarterMap;
  /** Blocks that turn into another after some ticks. */
  timed: { name: string; next: string; ticks: number }[];
  /** The restart door's bottom block, in world blocks (level 6). */
  restart?: [number, number];
  width: number;
}

export const GROUND = 10;
const AIR = { grav: PULL.down };
type Rules = Parameters<Book['add']>[2];

/** Where things are, for the bot: [dish, house door (the gate's column), exit, ...]. */
export const AT = {
  yard: { dish: 10, gate: 76, exit: 84, fences: [24, 44, 62], piles: [16, 19, 30, 33, 48, 51, 54, 70, 73], squirrels: [38, 66] },
  gravy: { dish: 10, gate: 72, exit: 80, vacuums: [24, 38, 52, 64] },
  park: { dish: 10, gate: 80, exit: 88, balls: [26, 40, 54, 68] },
  berry: { dish: 10, gate: 76, exit: 84, berries: [22, 34, 46, 58], pillars: [28, 40, 52, 64] },
  dog: { dish: 10, ladder: 20, shelf: [21, 28], bone: 26, dog: 44, gate: 64, exit: 72 },
  dash: { dish: 8, restart: 1, floats: [30, 48, 62], hall: 76, gate: 84, exit: 90 },
} as const;

/** The book every level starts from: the Starter blocks and the lock blocks (the house door is the gold gate). */
function newBook(pal: Pal): Book {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  return book;
}

function signs(book: Book, pal: Pal, list: Record<string, [string, number, number]>): Record<string, Sign> {
  const out: Record<string, Sign> = {};
  for (const [name, [text, w, h]] of Object.entries(list)) out[name] = addSign(book, pal, `${name}.sign`, text, w, h);
  return out;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (s: Sign) => GROUND - 1 - s.board.length;

/** The room: ground, hedges at both ends, the entrance at x 3 and the exit door at `exitX`. */
function room(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** A wall of brick from row 0 down to a locked gate (arch on row 8, gate on row 9). */
function wall(g: Grid, x: number): void {
  g.col(x, 0, GROUND - 3, 'B').put(x, GROUND - 2, 'l').put(x, GROUND - 1, 'L');
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** The neighbor's door, as every level's hand-over: a brick wall to the sky with the gate in it. */
function neighbor(m: StarterMap, x: number): void {
  m.wallToSky(x);
}

function bone(book: Book, pal: Pal): void {
  book.add('bone', art.bone(pal), { ...AIR, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
}

/** Level 1: Pumpkin Yard. */
function yard(pal: Pal): Level {
  const book = newBook(pal);
  book.add('dish', art.pie(pal), { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  book.add('leaf', art.leaves(pal, false), { ...AIR, score: 20, touch: 'leafFlat' });
  book.add('leafFlat', art.leaves(pal, true), AIR);
  book.add('pumpkin', art.pumpkin(pal), AIR);
  book.add('fence', art.fence(pal), { solid: SOLID });
  const s = signs(book, pal, {
    hello: ['OVEN BROKEN! CARRY THE PIE TO MRS PETTIGREW', 4, 4],
    leaf: ['LEAF PILES HIDE SNACKS. SCUFF THROUGH THEM', 4, 4],
    squirrel: ['SQUIRRELS ARE FRIENDLY. TOUCH ONE AND IT HOPS AWAY', 4, 4],
    door: ['HER DOOR OPENS FOR PIE ONLY', 4, 3],
    exit: ['NEXT HOUSE →', 4, 2],
  });
  const g = room(88, AT.yard.exit);
  wall(g, AT.yard.gate);
  scenery(g, [[7, 3], [20, 2], [36, 4], [54, 2], [70, 3]], [13, 27, 57], [9, 31, 47, 67]);
  const m = new StarterMap(book, g.rows());
  m.set(AT.yard.dish, 9, 'dish');
  for (const x of AT.yard.fences) m.set(x, 9, 'fence');
  for (const x of AT.yard.piles) m.set(x, 9, 'leaf');
  for (const x of [8, 36, 58, 73]) if (!AT.yard.piles.includes(x as never)) m.set(x, 9, 'pumpkin');
  for (const x of AT.yard.squirrels) m.mon(MONS.squirrel, x, 9);
  m.sign(5, onGround(s.hello), s.hello);
  m.sign(13, onGround(s.leaf), s.leaf);
  m.sign(40, onGround(s.squirrel), s.squirrel);
  m.sign(AT.yard.gate - 6, onGround(s.door), s.door);
  m.sign(AT.yard.exit - 4, onGround(s.exit), s.exit);
  neighbor(m, AT.yard.gate);
  return { file: 'yard', title: 'Pumpkin Yard', hint: 'Carry the pie. Scuff the leaves.', mood: 'yard', song: 'pie.cmf', book, map: m, timed: [], width: 88 };
}

/** Level 2: Gravy Slide. */
function gravy(pal: Pal): Level {
  const book = newBook(pal);
  book.add('dish', art.gravy(pal), { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  book.add('window', art.window(pal), AIR);
  book.add('pot', art.pot(pal), AIR);
  const s = signs(book, pal, {
    hello: ['A GRAVY BOAT SPILLS EASILY. KEEP YOUR HIT POINTS UP', 4, 4],
    vac: ['THE ROBOT VACUUMS THINK GRAVY IS A SNACK', 4, 4],
    jump: ['JUMP OVER A VACUUM. IT IS ONLY A FOOT HIGH', 4, 4],
    door: ['MR OKAFOR LIKES HIS GRAVY HOT', 4, 3],
    exit: ['NEXT HOUSE →', 4, 2],
  });
  const g = room(84, AT.gravy.exit);
  wall(g, AT.gravy.gate);
  g.row(9, 36, 38, 'c').row(9, 56, 58, 'c').row(9, 18, 20, 'c');
  const m = new StarterMap(book, g.rows());
  m.set(AT.gravy.dish, 9, 'dish');
  for (const x of [14, 30, 46, 60]) m.set(x, 5, 'window');
  for (const x of [8, 28, 44, 58, 66]) m.set(x, 9, 'pot');
  for (const x of AT.gravy.vacuums) m.mon(MONS.vacuum, x, 9);
  m.sign(5, onGround(s.hello), s.hello);
  m.sign(17, onGround(s.vac), s.vac);
  m.sign(32, onGround(s.jump), s.jump);
  m.sign(AT.gravy.gate - 6, onGround(s.door), s.door);
  m.sign(AT.gravy.exit - 4, onGround(s.exit), s.exit);
  neighbor(m, AT.gravy.gate);
  return { file: 'gravy', title: 'Gravy Slide', hint: 'Keep the gravy in the boat.', mood: 'kitchen', song: 'pie.cmf', book, map: m, timed: [], width: 84 };
}

/** Level 3: Windy Park. */
function park(pal: Pal): Level {
  const book = newBook(pal);
  book.add('dish', art.casserole(pal), { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  const s = signs(book, pal, {
    hello: ['THE PARK IS WINDY AND THE BIG GAME IS ON', 4, 4],
    balls: ['FOOTBALLS BOB UP AND DOWN. WAIT FOR A GAP', 4, 4],
    ref: ['NO TACKLING THE CASSEROLE', 4, 3],
    door: ['THE LOPEZ FAMILY IS HUNGRY', 4, 3],
    exit: ['NEXT HOUSE →', 4, 2],
  });
  const g = room(92, AT.park.exit);
  wall(g, AT.park.gate);
  g.row(9, 14, 16, 'c').row(9, 33, 34, 'c').row(9, 47, 48, 'c').row(9, 61, 62, 'c');
  scenery(g, [[6, 2], [18, 4], [30, 2], [44, 4], [60, 2], [72, 4]], [12, 36, 50, 74], [20, 42, 58, 70]);
  const m = new StarterMap(book, g.rows());
  m.set(AT.park.dish, 9, 'dish');
  for (const x of AT.park.balls) m.mon(MONS.football, x, 7);
  m.sign(5, onGround(s.hello), s.hello);
  m.sign(18, onGround(s.balls), s.balls);
  m.sign(46, onGround(s.ref), s.ref);
  m.sign(AT.park.gate - 6, onGround(s.door), s.door);
  m.sign(AT.park.exit - 4, onGround(s.exit), s.exit);
  neighbor(m, AT.park.gate);
  return { file: 'park', title: 'Windy Park', hint: 'Footballs everywhere. Wait for a gap.', mood: 'park', song: 'pie.cmf', book, map: m, timed: [], width: 92 };
}

/** Level 4: Cranberry Roll. */
function berry(pal: Pal): Level {
  const book = newBook(pal);
  book.add('dish', art.cranberry(pal), { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  const s = signs(book, pal, {
    hello: ['THE CRANBERRY SAUCE ROLLED OUT OF ITS CAN', 4, 4],
    roll: ['BERRIES ROLL BACK AND FORTH. HOP OVER THEM', 4, 4],
    door: ['MS TANAKA IS WAITING WITH A SPOON', 4, 3],
    exit: ['NEXT HOUSE →', 4, 2],
  });
  const g = room(88, AT.berry.exit);
  wall(g, AT.berry.gate);
  for (const x of AT.berry.pillars) g.put(x, 9, 'B');
  g.row(9, 14, 16, 'c').row(9, 36, 37, 'c').row(9, 56, 58, 'c');
  scenery(g, [[6, 2], [20, 4], [34, 2], [50, 4], [66, 2]], [12, 32, 62], [18, 46, 70]);
  const m = new StarterMap(book, g.rows());
  m.set(AT.berry.dish, 9, 'dish');
  for (const x of AT.berry.berries) m.mon(MONS.berry, x, 9);
  m.sign(5, onGround(s.hello), s.hello);
  m.sign(16, onGround(s.roll), s.roll);
  m.sign(AT.berry.gate - 6, onGround(s.door), s.door);
  m.sign(AT.berry.exit - 4, onGround(s.exit), s.exit);
  neighbor(m, AT.berry.gate);
  return { file: 'berry', title: 'Cranberry Roll', hint: 'The sauce is loose!', mood: 'cranberry', song: 'pie.cmf', book, map: m, timed: [], width: 88 };
}

/** Level 5: Hungry Dog. */
function dog(pal: Pal): Level {
  const book = newBook(pal);
  book.add('dish', art.rolls(pal), { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  bone(book, pal);
  book.add('dog', art.dog(pal, false), { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'dogChew' });
  book.add('dogChew', art.dog(pal, true), AIR);
  const s = signs(book, pal, {
    hello: ['A FRIENDLY DOG SMELLS THE ROLLS AND WILL NOT MOVE', 4, 4],
    bone: ['HE LOVES BONES MORE THAN ROLLS. CLIMB FOR ONE', 4, 4],
    dog: ['TOUCH THE DOG WITH A BONE IN HAND', 4, 4],
    door: ['THE ABELS ARE SET', 4, 3],
    exit: ['NEXT: TOWN →', 4, 2],
  });
  const g = room(76, AT.dog.exit);
  wall(g, AT.dog.gate);
  g.col(AT.dog.dog, 0, GROUND - 3, 'B').put(AT.dog.dog, GROUND - 2, 'l').put(AT.dog.dog, GROUND - 1, ' ');
  const [a, b] = AT.dog.shelf;
  g.row(3, a, b, 'G').fill(a, 4, b - a + 1, 1, 'D');
  g.col(AT.dog.ladder, 2, 9, 'H');
  g.row(9, 32, 34, 'c').row(9, 56, 58, 'c').row(2, a + 1, a + 3, 'c');
  scenery(g, [[8, 4], [30, 6], [50, 4], [62, 3]], [14, 36, 60], [12, 40, 54]);
  const m = new StarterMap(book, g.rows());
  m.set(AT.dog.dish, 9, 'dish');
  m.set(AT.dog.bone, 2, 'bone');
  m.set(AT.dog.dog, 9, 'dog');
  m.sign(5, onGround(s.hello), s.hello);
  m.sign(13, onGround(s.bone), s.bone);
  m.sign(AT.dog.dog - 5, onGround(s.dog), s.dog);
  m.sign(AT.dog.gate - 6, onGround(s.door), s.door);
  m.sign(AT.dog.exit - 4, onGround(s.exit), s.exit);
  m.wallToSky(AT.dog.dog);
  neighbor(m, AT.dog.gate);
  return { file: 'dog', title: 'Hungry Dog', hint: 'Outsmart a friendly dog.', mood: 'dusk', song: 'pie.cmf', book, map: m, timed: [], width: 76 };
}

/** Level 6: Parade Dash. */
function dash(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Level['timed'] = [];
  book.add('dish', art.rolls(pal), { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  const s = signs(book, pal, {
    hello: ['THE ROLLS ARE HOT NOW. THE BAR SHOWS HOW HOT', 4, 4],
    hall: ['THE TOWN HALL DOORS SHUT WHEN THE BAR IS EMPTY', 4, 4],
    redo: ['TOO SLOW? THE OVEN DOOR BAKES FRESH ONES', 4, 4],
    last: ['SET THE ROLLS ON THE LONG TABLE', 4, 3],
  });
  // the bar: five segments, each its own kind of block so each can go out at its own time
  for (let i = 0; i < 5; i++) {
    const out = (5 - i) * SEG_TICKS;
    for (const f of ['on', 'warn', 'off'] as const) book.add(`seg${i}.${f}`, art.segment(pal, f), AIR);
    timed.push({ name: `seg${i}.on`, next: `seg${i}.warn`, ticks: out - SEG_WARN }, { name: `seg${i}.warn`, next: `seg${i}.off`, ticks: SEG_WARN });
  }
  // the hall's doors: open and golden inside, then shut after the whole bar's time
  const [oTop, oBot] = art.hallDoor(pal, false);
  const [sTop, sBot] = art.hallDoor(pal, true);
  book.add('hall.open.top', oTop, AIR);
  book.add('hall.open.bottom', oBot, AIR);
  book.add('hall.shut.top', sTop, { solid: SOLID });
  book.add('hall.shut.bottom', sBot, { solid: SOLID });
  timed.push({ name: 'hall.open.top', next: 'hall.shut.top', ticks: HALL_OPEN }, { name: 'hall.open.bottom', next: 'hall.shut.bottom', ticks: HALL_OPEN });
  const [ovTop, ovBot] = art.ovenDoor(pal);
  book.add('oven.top', ovTop, AIR);
  book.add('oven.bottom', ovBot, AIR);
  book.add('balloon', art.balloon(pal)[0], AIR);
  const parts = art.balloon(pal);
  parts.forEach((p, i) => i && book.add(`balloon${i}`, p, AIR));
  const g = room(96, AT.dash.exit);
  wall(g, AT.dash.gate);
  for (const x of [AT.dash.hall - 1, AT.dash.hall, AT.dash.hall + 1]) g.col(x, 0, 7, 'B');
  g.row(9, 20, 22, 'c').row(9, 40, 42, 'c').row(9, 70, 72, 'c');
  scenery(g, [[8, 2], [60, 1]], [14, 36, 56], [18, 44, 66]);
  const m = new StarterMap(book, g.rows());
  m.set(AT.dash.dish, 9, 'dish');
  // the parade balloon floats over the street (scenery), three blocks square
  for (let i = 0; i < 9; i++) m.set(34 + (i % 3), 1 + Math.floor(i / 3), i ? `balloon${i}` : 'balloon');
  for (const x of AT.dash.floats) m.mon(MONS.float, x, 9);
  m.set(AT.dash.restart, 8, 'oven.top').set(AT.dash.restart, 9, 'oven.bottom');
  m.set(AT.dash.hall, 8, 'hall.open.top').set(AT.dash.hall, 9, 'hall.open.bottom');
  for (const x of BAR_X) {
    for (let i = 0; i < 5; i++) m.set(x + i, BAR_ROW, `seg${i}.on`);
  }
  m.sign(5, onGround(s.hello), s.hello);
  m.sign(12, onGround(s.hall), s.hall);
  m.sign(16, onGround(s.redo), s.redo);
  m.sign(AT.dash.gate - 6, onGround(s.last), s.last);
  neighbor(m, AT.dash.gate);
  m.wallToSky(AT.dash.hall - 1).wallToSky(AT.dash.hall + 1).wallToSky(AT.dash.hall);
  return { file: 'dash', title: 'Parade Dash', hint: 'Hot rolls! Run to the town hall.', mood: 'parade', song: 'dash.cmf', book, map: m, timed, restart: [AT.dash.restart + ORIGIN, 9 + ORIGIN], width: 96 };
}

/** The six levels in order. */
export function buildLevels(pal: Pal): Level[] {
  return [yard(pal), gravy(pal), park(pal), berry(pal), dog(pal), dash(pal)];
}

/** A level's finished block set, with its timed blocks given their next block and ticks. */
export function finishBook(level: Level): Block[] {
  const blocks = level.book.finish();
  for (const t of level.timed) {
    const b = blocks[level.book.n(t.name)];
    b.nextBl = level.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
