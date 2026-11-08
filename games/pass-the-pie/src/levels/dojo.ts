// 6. Sensei's Dojo (Mr. Plume). The new kick use: a vacuum he kicks stalls like one Rory feeds, and a stalled vacuum
// is a stair. Three tiers of a pagoda, each a ledge four blocks over the last with a quick vacuum pacing under the
// next one up; kick it, stand on it, go up. Then the ladder down, the board-breaking row of kick bags, two swooping
// drones to read and the dojo door, which shuts with the bar. Grandma's oven door at the start sets the clock back.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { ORIGIN } from '../../../kit/starter/map';
import { addClock, clock, placeBar, placeDoor, placeOven } from '../timing';
import { newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
/** Seconds the bar runs. */
export const SECONDS = 160;
export const AT = {
  oven: 1,
  warmBag: 11,
  vacA: 20,
  ledgeA: [19, 33],
  vacB: 28,
  ledgeB: [27, 41],
  gold: 40,
  vacC: 36,
  ledgeC: [35, 49],
  ladder: 50,
  bags: [56, 58, 60, 62],
  swoops: [67, 74],
  door: 82,
  exit: 86,
} as const;

export function dojo(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  addClock(book, pal, timed, clock(SECONDS));
  const s = signs(book, pal, {
    dojo: ["SENSEI'S DOJO. THE DOOR SHUTS WITH THE BAR.", 5, 3],
    nap: ['KICK A VACUUM. IT NAPS. STAND ON IT.', 4, 3],
    boards: ['BREAK THE BOARDS. THEY ARE BAGS. NOBODY ASKS.', 5, 3],
    drones: ['SENSEI SAYS: WHAT IS THE SOUND OF ONE DRONE?', 5, 3],
    door: ['SENSEI HAS A DENTIST. DOOR SHUTS WITH THE BAR.', 5, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  // the pagoda: siding behind three tiers, a roof on top
  st.g.fill(18, 6, 33, 11, 'Z').put(23, 10, 'W').put(31, 10, 'W').put(38, 6, 'W').put(45, 7, 'W');
  st.g.row(13, AT.ledgeA[0], AT.ledgeA[1], '=').row(12, 24, 26, 'c');
  st.g.row(9, AT.ledgeB[0], AT.ledgeB[1], '=').put(AT.gold, 8, '$').put(30, 8, 'c').put(32, 8, 'c');
  st.g.row(5, AT.ledgeC[0], AT.ledgeC[1], 'R').row(4, 41, 46, 'c').put(48, 4, 'N');
  st.g.put(AT.warmBag, G, '8').put(AT.vacA, G, '4').put(AT.vacB, G - 4, '4').put(AT.vacC, G - 8, '4');
  st.g.col(AT.ladder, 4, G, 'H');
  for (const x of AT.bags) st.g.put(x, G, '8');
  st.g.row(G - 4, 55, 63, 'c');
  for (const x of AT.swoops) st.g.put(x, 13, '7');
  st.g.col(AT.door, 0, G - 2, 'B');
  for (const [x, y] of [
    [8, 3],
    [29, 2],
    [55, 3],
    [76, 5],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['dojo']) => GROUND - 1 - sg.board.length;
  m.sign(6, board(s.dojo), s.dojo);
  m.sign(14, board(s.nap), s.nap);
  m.sign(51, board(s.boards), s.boards);
  m.sign(63, board(s.drones), s.drones);
  m.sign(AT.door - 6, board(s.door), s.door);
  for (const x of [13, 54, 74]) placeBar(m, x, 8);
  placeBar(m, 31, 3);
  placeDoor(m, AT.door, GROUND);
  placeOven(m, AT.oven, GROUND);
  m.wallToSky(AT.door);
  return {
    file: 'dojo',
    title: "Sensei's Dojo",
    hero: 'plume',
    hint: 'Kick it. It naps. Climb.',
    mood: 'dojo',
    song: 'payback.cmf',
    book,
    map: m,
    timed,
    restart: [AT.oven + ORIGIN, GROUND - 1 + ORIGIN],
  };
}
