// PASS THE PIE's six levels, two heroes taking turns. Each is painted on a Grid (a block a character; the kit's
// starter/map.ts says what the letters mean), with this game's own blocks (blocks.ts), signs (sign.ts) and monsters.
//
//   1. Pumpkin Yard  RORY   the storybook, played straight: carry the pie, scuff leaves, say hi to squirrels
//   2. Payback       PLUME  Uncle Dale's lawn of inflatable turkeys: learn the kick, the spare key on the shed
//   3. Gravy Slide   RORY   the vacuums are upset now: hop a moving one or take the counter over them
//   4. Windy Park    PLUME  tackling dummies (two kicks), the casserole up top, the parade crew's tent takes a dish
//   5. Hungry Dog    RORY   Dale's street, every turkey flat: the bone on the shelf past a vacuum, the dog, the toll
//   6. Big Gobble    PLUME  Rory hands over the rolls; the parade starts when the bar runs out; five kicks to the
//                          blower, then the town hall before its doors shut
//
// Rory's streets are printed in storybook inks and Mr. Plume's in fight-poster inks (palette.ts). Every room is
// closed in by hedges you can see.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { SILVER_KEYS } from '../../kit/starter/locks';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import type { Sign } from '../../kit/starter/sign';
import * as art from './art';
import { addPrintBlocks } from './blocks';
import { MONS } from './monsters';
import type { Mood } from './palette';
import { press } from './print';
import { roryStanding } from './rory';
import { addBill } from './sign';
import { BAR_ROW, BAR_X, HALL_OPEN, SEG_TICKS, SEG_WARN } from './timing';

export type Hero = 'rory' | 'plume';

export interface Level {
  file: string;
  title: string;
  /** Who plays it. */
  hero: Hero;
  /** The card's lines under the title. */
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

/** Where things are, for the bot. */
export const AT = {
  yard: { dish: 10, gate: 76, exit: 84, fences: [24, 44, 62], piles: [16, 19, 30, 33, 48, 51, 54, 70, 73], squirrels: [38, 66], shelf: [28, 29, 36] },
  lawn: { inflatables: [18, 30, 60, 64], vac: 38, shelf: [45, 46, 54], shelfTurkey: 50, key: 53, gate: 72, exit: 80 },
  gravy: { dish: 10, block: 20, vac: 30, counter: [45, 46, 58], counterVac: 50, gate: 70, exit: 78 },
  park: { dummies: [16, 26], shelf: [33, 34, 42], shelfDummy: 37, dish: 41, vac: 50, gate: 62, lateDummy: 68, exit: 82 },
  dog: { dish: 10, vac: 20, shelf: [27, 28, 37], shelfVac: 31, bone: 35, dog: 46, vac2: 54, gate: 66, exit: 74 },
  dash: { restart: 1, rory: 6, dish: 9, inflatables: [22, 40], floats: [30, 48], vac: 53, blower: 63, balloon: 62, hall: 70, gate: 79, exit: 86 },
} as const;

/** A level's book: this game's blocks. */
function newBook(pal: Pal): Book {
  const book = new Book('bbl');
  addPrintBlocks(book, pal);
  return book;
}

function signs(book: Book, pal: Pal, list: Record<string, [string, number, number]>): Record<string, Sign> {
  const out: Record<string, Sign> = {};
  for (const [name, [text, w, h]] of Object.entries(list)) out[name] = addBill(book, pal, name, text, w, h);
  return out;
}

/** The top row of a sign standing on the ground. */
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

/** A shelf on row 3 with a ladder up to it (`[ladder, from, to]`). */
function shelf(g: Grid, [ladder, from, to]: readonly [number, number, number], coins = true): void {
  g.row(3, from, to, 'G').fill(from, 4, to - from + 1, 1, 'D');
  g.col(ladder, 2, 9, 'H');
  if (coins) g.row(2, from + 1, to - 1, 'c');
}

/** A counter on row 6 (stand on it, jump up through it) with a ladder up to it. */
function counter(g: Grid, [ladder, from, to]: readonly [number, number, number]): void {
  g.row(6, from, to, '=');
  g.col(ladder, 5, 9, 'H');
  g.row(5, from + 1, to - 1, 'c');
}

/** A wall from the sky down to a gate: gold (`L`, opens for the dish) or steel (`M`, opens for a steel key). */
function wall(g: Grid, x: number, steel = false): void {
  g.col(x, 0, GROUND - 3, 'B')
    .put(x, GROUND - 2, steel ? 'm' : 'l')
    .put(x, GROUND - 1, steel ? 'M' : 'L');
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Hit points a hazard block takes, once (it is gone after that). */
export const BUMP = -10;

function hazard(book: Book, name: string, pic: Pixels): void {
  book.add(name, pic, { ...AIR, hp: BUMP, touch: 'sky' });
}

function dish(book: Book, pic: Pixels): void {
  book.add('dish', pic, { ...AIR, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
}

/** 1. Pumpkin Yard (Rory): the storybook, and every word of it meant. */
function yard(pal: Pal): Level {
  const book = newBook(pal);
  dish(book, art.pie(pal));
  book.add('leaf', art.leaves(pal, false), { ...AIR, score: 20, touch: 'leafFlat' });
  book.add('leafFlat', art.leaves(pal, true), AIR);
  book.add('pumpkin', art.pumpkin(pal), AIR);
  book.add('fence', art.fence(pal), { solid: SOLID });
  const s = signs(book, pal, {
    hello: ['IT IS A LOVELY MORNING. RORY HAS A PIE.', 4, 4],
    leaf: ['LEAF PILES! WHAT COULD BE INSIDE?', 4, 4],
    squirrel: ['THE SQUIRRELS SAY GOOD MORNING.', 4, 3],
    plume: ['MR. PLUME LOVES A PARADE. HE IS SO HAPPY.', 4, 4],
    door: ['MRS. PETTIGREW LOVES PIE.', 4, 3],
    exit: ['THE END.', 2, 2],
  });
  const g = room(88, AT.yard.exit);
  wall(g, AT.yard.gate);
  shelf(g, AT.yard.shelf);
  scenery(
    g,
    [
      [7, 3],
      [20, 2],
      [36, 4],
      [54, 2],
      [70, 3],
    ],
    [13, 27, 57],
    [9, 31, 47, 67],
  );
  const m = new StarterMap(book, g.rows());
  m.set(AT.yard.dish, 9, 'dish');
  for (const x of AT.yard.fences) m.set(x, 9, 'fence');
  for (const x of AT.yard.piles) m.set(x, 9, 'leaf');
  for (const x of [8, 36, 60]) m.set(x, 9, 'pumpkin');
  for (const x of AT.yard.squirrels) m.mon(MONS.squirrel, x, 9);
  m.mon(MONS.little, 12, 9);
  m.sign(4, onGround(s.hello), s.hello);
  m.sign(12, onGround(s.leaf), s.leaf);
  m.sign(39, onGround(s.squirrel), s.squirrel);
  m.sign(55, onGround(s.plume), s.plume);
  m.sign(AT.yard.gate - 11, onGround(s.door), s.door);
  m.sign(AT.yard.exit - 3, onGround(s.exit), s.exit);
  m.wallToSky(AT.yard.gate);
  return { file: 'yard', title: 'Pumpkin Yard', hero: 'rory', hint: 'A lovely morning. Carry the pie.', mood: 'yard', song: 'pie.cmf', book, map: m, timed: [], width: 88 };
}

/** 2. Payback (Mr. Plume): Uncle Dale's lawn. */
function lawn(pal: Pal): Level {
  const book = newBook(pal);
  const s = signs(book, pal, {
    flyer: ['PARADE MASCOT THIS YEAR: BIG GOBBLE. 30 FT. VINYL.', 4, 4],
    kick: ['ENTER KICKS. LAWN TURKEYS ARE VINYL. THEY CAN TAKE IT.', 4, 4],
    chat: ['CHAT. GRANDMA: WHO TOOK MY KITCHEN OUTLET?', 4, 4],
    key: ['DALE HIDES A SPARE KEY ON THE SHED. OF COURSE.', 4, 4],
    gate: ['GARDEN GATE. KEY, OR PATIENCE. NOT PATIENCE.', 4, 4],
  });
  const g = room(86, AT.lawn.exit);
  wall(g, AT.lawn.gate, true);
  shelf(g, AT.lawn.shelf, false);
  g.row(2, AT.lawn.shelf[1] + 1, AT.lawn.shelfTurkey - 1, 'c');
  g.row(9, 24, 26, 'c').row(9, 34, 35, 'c').row(9, 67, 68, 'c');
  scenery(
    g,
    [
      [10, 2],
      [36, 1],
      [58, 2],
    ],
    [16, 42],
    [28, 56, 70],
  );
  const m = new StarterMap(book, g.rows());
  for (const x of AT.lawn.inflatables) m.mon(MONS.inflatable, x, 9);
  m.mon(MONS.inflatable, AT.lawn.shelfTurkey, 2);
  m.mon(MONS.vacShort, AT.lawn.vac, 9);
  m.set(AT.lawn.key, 2, 'keySilver');
  m.sign(5, onGround(s.flyer), s.flyer);
  m.sign(11, onGround(s.kick), s.kick);
  m.sign(39, onGround(s.key), s.key);
  m.sign(53, onGround(s.chat), s.chat);
  m.sign(AT.lawn.gate - 6, onGround(s.gate), s.gate);
  m.wallToSky(AT.lawn.gate);
  return { file: 'lawn', title: 'Payback', hero: 'plume', hint: 'He has read the flyer.', mood: 'lawn', song: 'payback.cmf', book, map: m, timed: [], width: 86 };
}

/** 3. Gravy Slide (Rory): Mr. Okafor's kitchen to Aunt Marjorie's. */
function gravy(pal: Pal): Level {
  const book = newBook(pal);
  dish(book, art.gravy(pal));
  hazard(book, 'vacuum', art.vacuum(pal, false, true).map((_x, _y, c) => (c === art.T ? press(pal).paper[2] : c)));
  book.add('window', art.window(pal), AIR);
  book.add('pot', art.pot(pal), AIR);
  const s = signs(book, pal, {
    hello: ['RORY HAS THE GRAVY. IT IS STILL A LOVELY MORNING.', 4, 4],
    vac: ['THE VACUUMS ARE UPSET. NOBODY KNOWS WHY.', 4, 4],
    counter: ['THE COUNTER IS HIGH. THE VACUUMS ARE NOT.', 4, 4],
    chat: ['CHAT. MARJORIE: IS THE GRAVY LUMPY. ASKING FOR THE GRAVY', 4, 4],
    door: ['AUNT MARJORIE WILL JUDGE IT.', 4, 3],
  });
  const g = room(84, AT.gravy.exit);
  wall(g, AT.gravy.gate);
  counter(g, AT.gravy.counter);
  g.row(9, 24, 26, 'c').row(9, 63, 64, 'c');
  const m = new StarterMap(book, g.rows());
  m.set(AT.gravy.dish, 9, 'dish');
  for (const x of [14, 36, 66]) m.set(x, 3, 'window');
  for (const x of [8, 38]) m.set(x, 9, 'pot');
  m.set(AT.gravy.block, 9, 'vacuum');
  m.mon(MONS.vacShort, AT.gravy.vac, 9);
  m.mon(MONS.vacLong, AT.gravy.counterVac, 9);
  m.sign(4, onGround(s.hello), s.hello);
  m.sign(14, onGround(s.vac), s.vac);
  m.sign(40, onGround(s.counter), s.counter);
  m.sign(59, onGround(s.chat), s.chat);
  m.sign(AT.gravy.gate - 5, onGround(s.door), s.door);
  m.wallToSky(AT.gravy.gate);
  return { file: 'gravy', title: 'Gravy Slide', hero: 'rory', hint: 'Still a lovely morning. Mostly.', mood: 'kitchen', song: 'pie.cmf', book, map: m, timed: [], width: 84 };
}

/** 4. Windy Park (Mr. Plume): the parade crew's tent. */
function park(pal: Pal): Level {
  const book = newBook(pal);
  dish(book, art.casserole(pal));
  const s = signs(book, pal, {
    crew: ['THE PARADE CREW LETS IN ANYONE WITH A DISH.', 4, 4],
    dummy: ['TACKLING DUMMIES. TWO KICKS. THEY FEEL NOTHING.', 4, 4],
    cass: ['LOPEZ CASSEROLE UP TOP. MARJORIE MADE THE SAME ONE. SHH.', 4, 4],
    chat: ['CHAT. RORY: HAS ANYONE SEEN MR. PLUME', 4, 3],
    tent: ['CREW ONLY. DISHES WELCOME.', 4, 3],
  });
  const g = room(90, AT.park.exit);
  wall(g, AT.park.gate);
  shelf(g, AT.park.shelf, false);
  g.row(2, AT.park.shelf[1] + 1, AT.park.shelfDummy - 1, 'c');
  g.row(9, 20, 21, 'c').row(9, 47, 48, 'c').row(9, 72, 76, 'c');
  scenery(
    g,
    [
      [6, 2],
      [22, 1],
      [48, 2],
      [70, 1],
    ],
    [12, 44, 74],
    [30, 58],
  );
  const m = new StarterMap(book, g.rows());
  for (const x of AT.park.dummies) m.mon(MONS.dummy, x, 9);
  m.mon(MONS.dummy, AT.park.shelfDummy, 2);
  m.set(AT.park.dish, 2, 'dish');
  m.mon(MONS.vacLong, AT.park.vac, 9);
  m.mon(MONS.dummy, AT.park.lateDummy, 9);
  m.sign(5, onGround(s.crew), s.crew);
  m.sign(19, onGround(s.dummy), s.dummy);
  m.sign(28, onGround(s.cass), s.cass);
  m.sign(43, onGround(s.chat), s.chat);
  m.sign(AT.park.gate - 6, onGround(s.tent), s.tent);
  m.wallToSky(AT.park.gate);
  return { file: 'park', title: 'Windy Park', hero: 'plume', hint: 'Get into the parade tent.', mood: 'park', song: 'payback.cmf', book, map: m, timed: [], width: 90 };
}

/** 5. Hungry Dog (Rory): Uncle Dale's street, after Mr. Plume. */
function dog(pal: Pal): Level {
  const book = newBook(pal);
  dish(book, art.rolls(pal));
  book.add('bone', art.bone(pal), { ...AIR, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
  book.add('dog', art.dog(pal, false), { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'dogChew' });
  book.add('dogChew', art.dog(pal, true), AIR);
  hazard(book, 'vacuum', art.vacuum(pal, false, true).map((_x, _y, c) => (c === art.T ? press(pal).paper[2] : c)));
  book.add('flat', art.deflated(pal, true).map((_x, _y, c) => (c === art.T ? press(pal).paper[2] : c)), AIR);
  const s = signs(book, pal, {
    hello: ['RORY HAS THE ROLLS. THE LAWN TURKEYS ARE RESTING.', 4, 4],
    bone: ['BISCUIT WILL NOT MOVE FOR ROLLS. HE WILL FOR A BONE.', 4, 4],
    chat: ['CHAT. DALE: SOMEONE KICKED MY TURKEYS. ALL 14.', 4, 4],
    tired: ['THE NARRATOR WOULD LIKE TO LIE DOWN.', 4, 3],
    toll: ["DALE'S GATE. TOLL: ONE ROLL.", 4, 3],
  });
  const g = room(78, AT.dog.exit);
  wall(g, AT.dog.gate);
  g.col(AT.dog.dog, 0, GROUND - 3, 'B').put(AT.dog.dog, GROUND - 2, 'l');
  shelf(g, AT.dog.shelf, false);
  g.row(2, AT.dog.shelf[1] + 1, AT.dog.shelfVac - 2, 'c');
  g.row(9, 49, 50, 'c').row(9, 58, 59, 'c');
  scenery(
    g,
    [
      [8, 3],
      [40, 2],
      [62, 3],
    ],
    [58],
    [42],
  );
  const m = new StarterMap(book, g.rows());
  m.set(AT.dog.dish, 9, 'dish');
  for (const x of [16, 24, 40, 57, 71]) m.set(x, 9, 'flat');
  m.mon(MONS.vacShort, AT.dog.vac, 9);
  m.set(AT.dog.shelfVac, 2, 'vacuum');
  m.set(AT.dog.bone, 2, 'bone');
  m.set(AT.dog.dog, 9, 'dog');
  m.mon(MONS.vacLong, AT.dog.vac2, 9);
  m.sign(4, onGround(s.hello), s.hello);
  m.sign(41, onGround(s.bone), s.bone);
  m.sign(11, onGround(s.chat), s.chat);
  m.sign(48, onGround(s.tired), s.tired);
  m.sign(AT.dog.gate - 5, onGround(s.toll), s.toll);
  m.wallToSky(AT.dog.dog).wallToSky(AT.dog.gate);
  return { file: 'dog', title: 'Hungry Dog', hero: 'rory', hint: "Uncle Dale's street. Oh no.", mood: 'dusk', song: 'pie.cmf', book, map: m, timed: [], width: 78 };
}

/** 6. Big Gobble (Mr. Plume): the parade, the blower, the town hall. */
function dash(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Level['timed'] = [];
  dish(book, art.rolls(pal));
  hazard(book, 'float', art.floatCar(pal));
  const [rTop, rBottom] = roryStanding(pal);
  book.add('rory.top', rTop, AIR);
  book.add('rory.bottom', rBottom, AIR);
  const s = signs(book, pal, {
    rory: ['RORY: TAKE THE ROLLS. GO. I CANNOT FEEL MY LEGS.', 4, 4],
    bar: ['BAR RUNS OUT: PARADE STARTS, HALL SHUTS.', 4, 4],
    redo: ["TOO SLOW? GRANDMA'S OVEN DOOR. START OVER.", 4, 4],
    blower: ["BIG GOBBLE'S BLOWER. FIVE GOOD KICKS.", 4, 3],
    table: ['THE LONG TABLE.', 4, 2],
  });
  for (let i = 0; i < 5; i++) {
    const out = (5 - i) * SEG_TICKS;
    for (const f of ['on', 'warn', 'off'] as const) book.add(`seg${i}.${f}`, art.segment(pal, f), AIR);
    timed.push({ name: `seg${i}.on`, next: `seg${i}.warn`, ticks: out - SEG_WARN }, { name: `seg${i}.warn`, next: `seg${i}.off`, ticks: SEG_WARN });
  }
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
  art.bigGobble(pal).forEach((p, i) => book.add(`gobble${i}`, p, AIR));
  const g = room(90, AT.dash.exit);
  wall(g, AT.dash.gate);
  for (const x of [AT.dash.hall - 1, AT.dash.hall, AT.dash.hall + 1]) g.col(x, 0, 7, 'B');
  g.row(9, 25, 26, 'c').row(9, 44, 45, 'c');
  const m = new StarterMap(book, g.rows());
  m.set(AT.dash.rory, 8, 'rory.top').set(AT.dash.rory, 9, 'rory.bottom');
  m.set(AT.dash.dish, 9, 'dish');
  for (let i = 0; i < 9; i++) m.set(AT.dash.balloon + (i % 3), 5 + Math.floor(i / 3), `gobble${i}`);
  for (const x of AT.dash.inflatables) m.mon(MONS.inflatable, x, 9);
  for (const x of AT.dash.floats) m.set(x, 9, 'float');
  m.mon(MONS.vacLong, AT.dash.vac, 9);
  m.mon(MONS.blower, AT.dash.blower, 9);
  m.set(AT.dash.restart, 8, 'oven.top').set(AT.dash.restart, 9, 'oven.bottom');
  m.set(AT.dash.hall, 8, 'hall.open.top').set(AT.dash.hall, 9, 'hall.open.bottom');
  for (const x of BAR_X) for (let i = 0; i < 5; i++) m.set(x + i, BAR_ROW, `seg${i}.on`);
  m.sign(10, onGround(s.rory), s.rory);
  m.sign(24, onGround(s.bar), s.bar);
  m.sign(16, onGround(s.redo), s.redo);
  m.sign(55, onGround(s.blower), s.blower);
  m.sign(AT.dash.gate - 6, onGround(s.table), s.table);
  m.wallToSky(AT.dash.gate)
    .wallToSky(AT.dash.hall - 1)
    .wallToSky(AT.dash.hall + 1)
    .wallToSky(AT.dash.hall);
  return {
    file: 'dash',
    title: 'Big Gobble',
    hero: 'plume',
    hint: 'Five kicks. One parade.',
    mood: 'parade',
    song: 'payback.cmf',
    book,
    map: m,
    timed,
    restart: [AT.dash.restart + ORIGIN, 9 + ORIGIN],
    width: 90,
  };
}

/** The six levels in order. */
export function buildLevels(pal: Pal): Level[] {
  return [yard(pal), lawn(pal), gravy(pal), park(pal), dog(pal), dash(pal)];
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
