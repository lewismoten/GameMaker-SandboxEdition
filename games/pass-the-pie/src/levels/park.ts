// 4. Windy Park (Mr. Plume). The parade crew's park on a gusty afternoon: a drone and a kick bag, a pond too wide to
// jump that a tailwind carries him over, lawn turkeys, a warm-air grate that lifts him to the bandstand roof where
// the casserole waits behind a kick bag, two swooping drones to read, the crew tent's gate, and a second grate up to a
// ledge with the gold acorn.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import * as art from '../art';
import { dish, newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
export const AT = {
  drone: 12,
  bag: 20,
  wind: [22, 32],
  pond: [25, 30],
  turkeys: [35, 37],
  lift: 41,
  roof: [42, 51],
  roofBag: 45,
  casserole: 49,
  ladder: 52,
  swoops: [56, 63],
  gate: 71,
  highDrone: 77,
  lift2: 80,
  ledge: [81, 85],
  gold: 84,
  exit: 87,
} as const;

export function park(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  dish(book, art.casserole(pal));
  const s = signs(book, pal, {
    crew: ['PARADE CREW TENT. A DISH GETS YOU IN.', 4, 3],
    wind: ['TAILWIND: JUMP!', 4, 2],
    lift: ['WARM AIR RISES. SO DO TURKEYS.', 4, 3],
    tent: ['CREW ONLY. DISHES WELCOME.', 4, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  st.gate(AT.gate, GROUND);
  st.g.put(AT.drone, G, '6').put(AT.bag, G, '8');
  // the tailwind over the pond (two blocks deep; a jump without the wind lands in it, and it is shallow enough to climb out)
  st.g.fill(AT.wind[0], 9, AT.wind[1] - AT.wind[0] + 1, GROUND - 9, 'w');
  st.g.fill(AT.pond[0], GROUND, AT.pond[1] - AT.pond[0] + 1, 2, ' ');
  st.g.row(12, AT.pond[0], AT.pond[1], 'c');
  for (const x of AT.turkeys) st.g.put(x, G, '9');
  // the grate and its warm air up to the bandstand roof: the casserole behind a kick bag, a ladder down
  st.g.put(AT.lift, GROUND, 'U').col(AT.lift, 2, G, 'u');
  st.g
    .row(4, AT.roof[0], AT.roof[1], 'R')
    .row(3, AT.roof[0] + 1, AT.roof[1] - 1, 'c')
    .put(AT.roofBag, 3, '8')
    .put(AT.casserole, 3, 'P');
  st.g
    .fill(AT.roof[0] + 1, 5, AT.roof[1] - AT.roof[0] - 1, G - 4, 'Z')
    .put(45, 8, 'W')
    .put(48, 8, 'W');
  st.g.col(AT.ladder, 3, G, 'H');
  // two swooping drones, read them and kick as they come down
  for (const x of AT.swoops) st.g.put(x, 13, '7');
  st.g.row(G - 4, 57, 65, 'c').put(68, G, 'N');
  // past the tent: a high drone, the second grate up to the gold acorn's ledge
  st.g.put(AT.highDrone, G, '0');
  st.g.put(AT.lift2, GROUND, 'U').col(AT.lift2, 2, G, 'u').row(5, AT.ledge[0], AT.ledge[1], '=').put(AT.gold, 4, '$').put(82, 4, 'c').put(83, 4, 'c');
  for (const [x, y] of [
    [7, 2],
    [27, 3],
    [58, 2],
    [76, 6],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['crew']) => GROUND - 1 - sg.board.length;
  m.sign(4, board(s.crew), s.crew);
  m.sign(15, board(s.wind), s.wind);
  m.sign(AT.lift - 5, board(s.lift), s.lift);
  m.sign(AT.gate - 5, board(s.tent), s.tent);
  m.wallToSky(AT.gate);
  return { file: 'park', title: 'Windy Park', hero: 'plume', hint: 'Get into the parade tent.', mood: 'park', song: 'payback.cmf', book, map: m, timed };
}
