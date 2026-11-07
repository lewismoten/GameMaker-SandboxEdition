// Level 10, SUMMIT PICNIC (a scene you watch, the next morning): Old Mossback is home in its hollow, sitting down,
// so its summit is only as high as a bungalow, with steps up the side. The sun comes up. Mr. Hale and Mrs. Okoro
// climb up with leftovers for a picnic on top; Wisp floats in and settles over the summit, where a cloud belongs.
// At the mountain's foot there is a brand-new doormat. Walk along, climb up, read, watch.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, mountain, onGround, placeFace, startBook, type Level } from '../level';
import { PICNIC } from '../monsters';

export const G10 = 14;
export const TOP = 7;

export const PICNIC_AT = {
  steps: [19, 32],
  top: [33, 48],
  blanket: 38,
  mat: 15,
  neighbors: { hale: 9, okoro: 5 },
  wisp: [48, 4],
  sun: [63, 9],
  exit: 47,
  signs: { home: 5, mat: 15, end: 42 },
} as const;

const SIGNS = {
  home: ['HOME AGAIN, RIGHT WHERE IT BELONGS.', 4, 3],
  mat: ['PLEASE WIPE YOUR FOOTHILLS', 4, 3],
  end: ['THE END OF THE TRAIL. THANK YOU, TESS!', 4, 3],
} as const;

export function levelPicnic(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['mountain', 'trail', 'picnic']);
  const s = addSigns(book, pal, SIGNS);
  const W = 70;
  const P = PICNIC_AT;
  const g = new Grid(W, 18);
  g.row(G10, 0, W - 1, 'G').fill(0, G10 + 1, W, 3, 'D');
  g.col(0, 0, G10 - 1, 'X').col(W - 1, 0, G10 - 1, 'X');
  g.put(3, G10 - 2, 's').put(3, G10 - 1, 'S');
  const m = new StarterMap(book, g.rows());
  // the mountain, sitting down: a low peak, a flat top to picnic on, rocky steps up its side
  mountain(m, 40, TOP - 2, 1, G10, 1, W - 2);
  for (let x = P.top[0]; x <= P.top[1]; x++) m.set(x, TOP, 'ledge');
  for (let x = P.top[0]; x <= P.top[1]; x++) for (let y = TOP - 3; y < TOP; y++) m.set(x, y, 'sky');
  for (let x = P.steps[0]; x <= P.steps[1]; x++) m.set(x, G10 - 1 - Math.floor((x - P.steps[0]) / 2), 'step');
  m.set(P.blanket, TOP - 1, 'blanketL').set(P.blanket + 1, TOP - 1, 'blanketM').set(P.blanket + 2, TOP - 1, 'blanketR');
  m.set(P.mat - 1, G10 - 1, 'matL').set(P.mat, G10 - 1, 'matM').set(P.mat + 1, G10 - 1, 'matR').set(P.mat + 2, G10 - 1, 'matR');
  m.set(P.exit, TOP - 2, 'doorTop').set(P.exit, TOP - 1, 'doorBottom');
  m.exits.push({ from: [P.exit + 10, TOP - 1 + 10] });
  for (const [x, y] of [
    [10, 2],
    [56, 3],
  ])
    m.set(x, y, 'cloudL').set(x + 1, y, 'cloudR');
  placeFace(m, PICNIC.face, 36, 43, 9, 40, 12);
  m.mon(PICNIC.sunRise, P.sun[0], P.sun[1]);
  m.mon(PICNIC.hale, P.neighbors.hale, G10 - 2).mon(PICNIC.hale + 1, P.neighbors.hale, G10 - 1).mon(PICNIC.hale + 6, P.neighbors.hale + 28, TOP - 3);
  m.mon(PICNIC.okoro, P.neighbors.okoro, G10 - 2).mon(PICNIC.okoro + 1, P.neighbors.okoro, G10 - 1).mon(PICNIC.okoro + 6, P.neighbors.okoro + 36, TOP - 3);
  m.mon(PICNIC.wisp, P.wisp[0], P.wisp[1]);
  m.sign(P.signs.home, onGround(G10, s.home), s.home);
  m.sign(P.signs.mat, onGround(G10 - 1, s.mat) + 1, s.mat);
  m.sign(P.signs.end, onGround(TOP, s.end), s.end);
  return { file: 'picnic', title: 'Summit Picnic', hint: 'Climb up. Watch who comes.', look: 'sunrise', map: m, book, timed, mon: 'picnic', song: 'home', watch: true };
}
