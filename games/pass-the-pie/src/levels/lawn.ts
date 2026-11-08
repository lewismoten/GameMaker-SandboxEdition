// 2. Payback (Mr. Plume). Uncle Dale's lawn, after the flyer: lawn turkeys to learn the combo on (WHAP, WHAP, POW),
// a kick bag, the shed roof with Dale's spare garden key and a drone guarding it, a drone that swoops (wait for it
// to come down, then kick), a wall of three turkeys one POW clears, crates up to the garage roof, the garden gate.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { newBook, signs, Stage, type Level, type Timed } from './common';

export const GROUND = 17;
export const AT = {
  turkeys: [15, 17, 22],
  bag: 26,
  shedLadder: 28,
  shedRoof: [29, 39],
  roofDrone: 31,
  key: 38,
  swoop: 44,
  wall: [48, 49, 50],
  bag2: 55,
  vac: 58,
  crates: [62, 63],
  garageRoof: [64, 75],
  garageDrone: 67,
  gold: 75,
  gate: 79,
  exit: 86,
} as const;

export function lawn(pal: Pal): Level {
  const book = newBook(pal);
  const timed: Timed[] = [];
  const s = signs(book, pal, {
    flyer: ["NEW PARADE MASCOT: BIG GOBBLE. 30 FT OF VINYL.", 4, 3],
    kick: ['ENTER: WHAP, WHAP, POW.', 3, 2],
    chat: ['GRANDMA: WHO TOOK MY KITCHEN OUTLET?', 4, 3],
    gate: ['GARDEN GATE. DALE KEEPS A SPARE.', 4, 3],
  });
  const st = new Stage(90, 20, GROUND, AT.exit);
  const G = GROUND - 1;
  st.gate(AT.gate, GROUND, true);
  for (const x of AT.turkeys) st.g.put(x, G, '9');
  st.g.put(AT.bag, G, '8');
  // the shed: siding, a ladder, a roof with the key at the far end and a drone patrolling it
  st.g.fill(30, 11, 9, G - 10, 'Z').col(AT.shedLadder, 9, G, 'H').row(10, AT.shedRoof[0], AT.shedRoof[1], 'R');
  st.g.put(AT.roofDrone, 9, '6').put(AT.key, 9, 'K').put(33, 13, 'W').put(36, 13, 'W');
  for (let x = 30; x < 37; x += 2) st.g.put(x, 8, 'c');
  // the swooping drone over open lawn, then a wall of turkeys
  st.g.put(AT.swoop, 13, '7');
  for (const x of AT.wall) st.g.put(x, G, '9');
  st.g.row(G - 3, 46, 52, 'c');
  st.g.put(AT.bag2, G, '8').put(AT.vac, G, '3');
  // crates up to the garage roof (four blocks up), a drone on it and the gold acorn at its far end
  st.g.put(AT.crates[0], G, 'C').put(AT.crates[1], G, 'C').put(AT.crates[1], G - 1, 'C');
  st.g.fill(65, 14, 10, G - 13, 'Z').row(13, AT.garageRoof[0], AT.garageRoof[1], 'R').put(68, 15, 'W').put(72, 15, 'W');
  st.g.put(AT.garageDrone, 12, '6').put(AT.gold, 12, '$').put(70, 12, 'N');
  for (let x = 66; x < 74; x += 2) st.g.put(x, 11, 'c');
  for (const [x, y] of [
    [9, 3],
    [41, 2],
    [60, 4],
    [82, 3],
  ])
    st.g.put(x, y, '(').put(x + 1, y, ')');
  const m = st.paint(book, pal, timed);
  const board = (sg: (typeof s)['flyer']) => GROUND - 1 - sg.board.length;
  m.sign(4, board(s.flyer), s.flyer);
  m.sign(9, board(s.kick), s.kick);
  m.sign(40, board(s.chat), s.chat);
  m.sign(AT.gate - 4, board(s.gate), s.gate);
  m.wallToSky(AT.gate);
  return { file: 'lawn', title: 'Payback', hero: 'plume', hint: 'He has read the flyer.', mood: 'lawn', song: 'payback.cmf', book, map: m, timed, before: 'payback.fli' };
}
