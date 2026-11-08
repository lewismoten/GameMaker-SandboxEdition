// 3. Gravy Relay (Rory). Three kitchens in a row and a bar running out: the gravy to Aunt Marjorie's door, the
// cranberry sauce off a shelf too high to jump to (feed the quick vacuum under it and stand on it), Mr. Okafor's door,
// then the dining room before its doors shut with the bar. Grandma's oven door at the start sets every clock back.
// A ladder up to the top cabinet has a gold acorn for anyone with time to spare.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { ORIGIN } from '../../../kit/starter/map';
import * as art from '../art';
import { addClock, clock, placeBar, placeDoor, placeOven } from '../timing';
import { dish, newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
/** Seconds the bar runs. */
export const SECONDS = 90;
export const AT = {
  oven: 1,
  gravy: 6,
  vac: 14,
  counter: [13, 20],
  cabinet: [18, 25],
  gateA: 31,
  quickVac: 36,
  highShelf: [35, 44],
  cranberry: 42,
  longVac: 47,
  counter2: [46, 54],
  gateB: 58,
  mower: 62,
  ledge: [61, 70],
  ladder: 73,
  top: [65, 72],
  gold: 66,
  door: 80,
  exit: 86,
} as const;

export function gravy(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  dish(book, art.gravy(pal));
  dish(book, art.cranberry(pal), 'dish2');
  addClock(book, pal, timed, clock(SECONDS));
  const s = signs(book, pal, {
    bar: ['THE GRAVY SKINS OVER WHEN THE BAR RUNS OUT.', 4, 3],
    marj: ['AUNT MARJORIE', 4, 2],
    feed: ['FEED ONE. STAND ON IT.', 3, 2],
    okafor: ['MR. OKAFOR', 4, 2],
    dinner: ['DINNER. DOORS SHUT WITH THE BAR.', 4, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  st.gate(AT.gateA, GROUND);
  st.gate(AT.gateB, GROUND);
  st.g.put(AT.gravy, G, 'P');
  // the first kitchen: a counter over a vacuum, a cabinet shelf above it, cider at its end
  st.g.row(14, AT.counter[0], AT.counter[1], '=').row(13, AT.counter[0] + 1, AT.counter[1] - 1, 'c').put(AT.vac, G, '2');
  st.g.row(11, AT.cabinet[0], AT.cabinet[1], '=').row(10, AT.cabinet[0] + 1, AT.cabinet[1] - 2, 'c').put(AT.cabinet[1], 10, 'N');
  st.g.put(27, 12, 'W').put(24, G, 'o');
  // the second: the cranberry sauce on a shelf four blocks up, the quick vacuum under it
  st.g.row(13, AT.highShelf[0], AT.highShelf[1], '=').row(12, AT.highShelf[0] + 1, AT.highShelf[1] - 1, 'c').put(AT.cranberry, 12, 'J');
  st.g.put(AT.quickVac, G, '4');
  st.g.row(14, AT.counter2[0], AT.counter2[1], '=').row(13, AT.counter2[0] + 1, AT.counter2[1] - 1, 'c').put(AT.longVac, G, '3');
  st.g.put(50, 10, 'W');
  // the third: the mower under a ledge, a ladder up to the top cabinet and its gold acorn
  st.g.put(AT.mower, G, '5').row(14, AT.ledge[0], AT.ledge[1], '=').row(13, AT.ledge[0] + 1, AT.ledge[1] - 1, 'c');
  st.g.col(AT.ladder, 7, G, 'H').row(8, AT.top[0], AT.top[1], '=').row(7, AT.top[0] + 2, AT.top[1], 'c').put(AT.gold, 7, '$');
  st.g.put(76, G, 'o').put(83, G, 'o');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['bar']) => GROUND - 1 - sg.board.length;
  m.sign(8, board(s.bar), s.bar);
  m.sign(AT.gateA - 4, board(s.marj), s.marj);
  m.sign(AT.gateA + 1, board(s.feed), s.feed);
  m.sign(AT.gateB - 4, board(s.okafor), s.okafor);
  m.sign(AT.door - 6, board(s.dinner), s.dinner);
  for (const x of [5, 26, 47, 59, 75]) placeBar(m, x, 9);
  placeDoor(m, AT.door, GROUND);
  placeOven(m, AT.oven, GROUND);
  m.wallToSky(AT.gateA).wallToSky(AT.gateB);
  return {
    file: 'gravy',
    title: 'Gravy Relay',
    hero: 'rory',
    hint: 'Two dishes, two doors, one bar.',
    mood: 'kitchen',
    song: 'chase.cmf',
    book,
    map: m,
    timed,
    restart: [AT.oven + ORIGIN, GROUND - 1 + ORIGIN],
  };
}
