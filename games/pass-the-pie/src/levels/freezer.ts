// 11. The Freezer Raid (Rory). Midnight in Dale's cold-storage shed, where the spare pie is kept, and the freezer door
// shuts with the bar. A vent's warm air up to the first ledge and a ladder down; a runaway vacuum fed and stood on up to
// the long shelf; a second vent up to the top ledge and the spare pie; a ladder down, a short vacuum to stall on the
// way to the gate that takes the pie, and the freezer door. Every stop costs seconds, so the bar is the level.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import * as art from '../art';
import { ORIGIN } from '../../../kit/starter/map';
import { addClock, clock, placeBar, placeDoor, placeOven } from '../timing';
import { dish, newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
/** Seconds the bar runs. */
export const SECONDS = 105;
export const AT = {
  oven: 1,
  lift: 10,
  ledge: [11, 20],
  ladder: 21,
  vac: 27,
  shelf: [26, 40],
  lift2: 46,
  top: [47, 56],
  pie: 55,
  ladder2: 57,
  short: 62,
  gate: 70,
  door: 80,
  exit: 86,
} as const;

export function freezer(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  addClock(book, pal, timed, clock(SECONDS));
  dish(book, art.pie(pal));
  const s = signs(book, pal, {
    night: ['MIDNIGHT. THE SPARE PIE IS IN THE SHED FREEZER.', 5, 3],
    vent: ['FREEZER FAN. WARM AIR UP. COLD FEET DOWN.', 5, 3],
    spare: ['SPARE PIE: DO NOT TOUCH. SIGNED, RORY.', 5, 3],
    door: ['THE FREEZER DOOR SHUTS WITH THE BAR. IT HAS FEELINGS.', 5, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  st.gate(AT.gate, GROUND);
  // the shed: siding behind the ledges, frosted windows
  st.g.fill(9, 2, 50, 14, 'Z').put(14, 8, 'W').put(18, 10, 'W').put(31, 6, 'W').put(36, 9, 'W').put(50, 9, 'W').put(54, 8, 'W');
  // the first vent and its ledge, a ladder down
  st.g.put(AT.lift, GROUND, 'U').col(AT.lift, 2, G, 'u');
  st.g.row(4, AT.ledge[0], AT.ledge[1], 'R').row(3, 14, 16, 'c').put(19, 3, 'N').col(AT.ladder, 3, G, 'H');
  // the runaway vacuum, the long shelf over it
  st.g.put(AT.vac, G, '4').row(13, AT.shelf[0], AT.shelf[1], '=').row(12, 32, 34, 'c').put(38, 12, '$');
  // the second vent and the top ledge with the spare pie, a ladder down
  st.g.put(AT.lift2, GROUND, 'U').col(AT.lift2, 2, G, 'u');
  st.g.row(4, AT.top[0], AT.top[1], 'R').row(3, 49, 52, 'c').put(AT.pie, 3, 'P').col(AT.ladder2, 3, G, 'H');
  st.g.put(AT.short, G, '2');
  st.g.col(AT.door, 0, G - 2, 'B');
  for (const [x, y] of [
    [6, 8],
    [25, 3],
    [44, 12],
    [66, 4],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['night']) => GROUND - 1 - sg.board.length;
  m.sign(5, board(s.night), s.night);
  m.sign(AT.lift - 5, board(s.vent), s.vent);
  m.sign(AT.top[0], 3 - s.spare.board.length, s.spare);
  m.sign(AT.door - 6, board(s.door), s.door);
  for (const [x, y] of [
    [2, 6],
    [28, 8],
    [60, 8],
  ])
    placeBar(m, x, y);
  placeDoor(m, AT.door, GROUND);
  placeOven(m, AT.oven, GROUND);
  m.wallToSky(AT.door);
  return {
    file: 'freezer',
    title: 'The Freezer Raid',
    hero: 'rory',
    hint: 'Fans up, ladders down. Mind the bar.',
    mood: 'frost',
    song: 'pie.cmf',
    book,
    map: m,
    timed,
    restart: [AT.oven + ORIGIN, GROUND - 1 + ORIGIN],
  };
}
