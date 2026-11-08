// 7. Big Gobble (Mr. Plume). The parade route, against the bar: when it runs out the parade starts and the town
// hall shuts. Rory holds the hall doors. The fight comes in three parts:
//   1. Big Gobble itself, bobbing over a street it shakes with every thump, puffs little balloon turkeys out of its
//      beak that drift at him (kick them as they come)
//   2. its three tether stakes: one on the street, one up on the parade stand's ledge (a ladder up, a hedge too tall
//      to jump below it), one by the floats with a drone that drops at him
//   3. the blower, nine hits, guarded by a drone; then the hall before its doors shut
// Grandma's oven door at the start sets the clocks back.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { ORIGIN } from '../../../kit/starter/map';
import * as art from '../art';
import * as art3 from '../art3';
import { MONS } from '../monsters';
import { roryStanding } from '../rory';
import { addClock, clock, placeBar, placeDoor, placeOven } from '../timing';
import { AIR, newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
/** Seconds the bar runs. */
export const SECONDS = 110;
/** Ticks between the little balloons Big Gobble puffs out. */
export const PUFF_TICKS = 140;
export const AT = {
  oven: 1,
  rory: 6,
  drone: 12,
  turkey: 18,
  gobble: 24,
  shake: [21, 33],
  stake1: 36,
  ladder: 40,
  ledge: [40, 52],
  hedge: 47,
  stake2: 45,
  stake3: 57,
  swoop: 60,
  blower: 66,
  guard: 69,
  hall: 75,
  exit: 86,
} as const;

export function gobble(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  addClock(book, pal, timed, clock(SECONDS));
  const [rTop, rBottom] = roryStanding(pal);
  book.add('rory.top', rTop, AIR);
  book.add('rory.bottom', rBottom, AIR);
  // Big Gobble, bobbing: each of its nine blocks turns into the same piece a pixel lower and back
  const up = art.bigGobble(pal);
  up.forEach((p, i) => {
    const low = p.map((x, y) => (y === 0 ? p.get(x, 0) : p.get(x, y - 1)));
    book.add(`gobble${i}`, p, AIR);
    book.add(`gobble${i}b`, low, AIR);
    timed.push({ name: `gobble${i}`, next: `gobble${i}b`, ticks: 9 }, { name: `gobble${i}b`, next: `gobble${i}`, ticks: 9 });
  });
  // the street it shakes: the grass jumps and dust kicks up on every thump
  const grass = book.pics.get('grass')!;
  book.add('shake0', grass, { solid: 15 });
  book.add('shake1', art3.rumble(pal, grass, true), { solid: 15 });
  timed.push({ name: 'shake0', next: 'shake1', ticks: 15 }, { name: 'shake1', next: 'shake0', ticks: 3 });
  const s = signs(book, pal, {
    rory: ["RORY: I'LL HOLD THE HALL DOORS. GO!", 4, 3],
    stakes: ['THREE TETHER STAKES. THEN THE BLOWER.', 4, 3],
    table: ['THE LONG TABLE', 3, 2],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  st.g.put(AT.drone, G, '6').put(AT.turkey, G, '9');
  st.g.put(AT.stake1, G, '!');
  // the parade stand: a ladder up to its ledge, a hedge too tall to jump under it, the second stake on top
  st.g.col(AT.ladder, 11, G, 'H').row(12, AT.ledge[0] + 1, AT.ledge[1], '=').col(AT.hedge, 13, G, 'X').put(AT.stake2, 11, '!');
  st.g.row(11, 48, 51, 'c').put(42, 11, 'N');
  st.g.put(AT.stake3, G, '!').put(AT.swoop, 13, '7');
  st.g.put(AT.blower, G, '@').put(AT.guard, G, '6').col(AT.hall, 0, G - 2, 'B');
  st.g.row(13, 62, 72, 'c');
  for (const [x, y] of [
    [9, 3],
    [33, 2],
    [62, 4],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  m.set(AT.rory, G - 1, 'rory.top').set(AT.rory, G, 'rory.bottom');
  for (let i = 0; i < 9; i++) m.set(AT.gobble + (i % 3), G - 2 + Math.floor(i / 3), `gobble${i}`);
  for (let x = AT.shake[0]; x <= AT.shake[1]; x++) m.set(x, GROUND, 'shake0');
  const board = (sg: (typeof s)['rory']) => GROUND - 1 - sg.board.length;
  m.sign(7, board(s.rory), s.rory);
  m.sign(AT.stake1 - 5, board(s.stakes), s.stakes);
  m.sign(AT.exit - 5, board(s.table), s.table);
  for (const x of [13, 34, 53, 70]) placeBar(m, x, 8);
  placeDoor(m, AT.hall, GROUND);
  placeOven(m, AT.oven, GROUND);
  m.wallToSky(AT.hall);
  return {
    file: 'gobble',
    title: 'Big Gobble',
    hero: 'plume',
    hint: 'Three stakes. One blower. One parade.',
    mood: 'parade',
    song: 'gobble.cmf',
    book,
    map: m,
    timed,
    restart: [AT.oven + ORIGIN, G + ORIGIN],
    births: [
      { name: 'gobble4', mon: MONS.gobblet, ticks: PUFF_TICKS },
      { name: 'gobble4b', mon: MONS.gobblet, ticks: PUFF_TICKS },
    ],
  };
}
