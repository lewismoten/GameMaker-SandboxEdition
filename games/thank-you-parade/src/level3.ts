// Level 3, Meanwhile: Marge's airstrip, played as Marge. Someone has pulled the THANK YOU banner apart and scattered its
// eight letters around the field (and hung a purple NO beside it). Two letters are up in the hangar's rafters (a ladder),
// one on the hangar floor, two on top of hay bale stacks (jump bale to bale), one on a plank over a goose lane, one on a
// bale by the plane and one under the plane's wing. The banner rack takes all eight; then the cockpit is the way out.
// Gigi's third playbook page sits on a lookout plank past the tallest stack, a jump out from its top.
import { StarterMap } from '../../kit/starter/map';
import { addPage, baseBook } from './base';
import { AIRSTRIP_SIGNS } from './text';
import { Level, GROUND, addSigns, column, onGround, room, run } from './lay';
import { addAirstrip, PLANE } from './airstrip';
import { MONS } from './monsters';
import type { Pal } from './print';

export const AT3 = {
  width: 84,
  hangar: [1, 21],
  ladder: 6,
  rafters: [7, 20],
  /** Each letter: [x, y]. */
  letters: {
    T: [11, 4],
    H: [18, 4],
    A: [15, 9],
    N: [32, 5],
    K: [36, 3],
    Y: [51, 7],
    O: [60, 7],
    U: [67, 9],
  } as Record<string, [number, number]>,
  /** Bale stacks: [first x, last x, top row]. */
  stacks: [
    [29, 30, 8],
    [32, 33, 6],
    [35, 36, 4],
    [59, 60, 8],
  ] as [number, number, number][],
  lookout: [39, 41],
  page: 41,
  geese: [47, 55],
  plankY: [50, 52],
  rack: 71,
  plane: 74,
  exit: 76,
} as const;

export function level3(pal: Pal): Level {
  const book = baseBook(pal);
  addAirstrip(book, pal);
  addPage(book, pal);
  const s = addSigns(book, pal, AIRSTRIP_SIGNS);
  const g = room(AT3.width, AT3.exit);
  const m = new StarterMap(book, g.rows());
  // the hangar: a roof on posts, rafters reached by a ladder, a concrete apron
  const [h0, h1] = AT3.hangar;
  for (let x = h0; x <= h1; x++) m.set(x, 1, 'roof').set(x, GROUND, 'apron');
  for (const x of [h0 + 1, 13, h1]) column(m, 'shed', x, 2, GROUND - 1); // the hangar's open frame
  m.set(3, 8, 'doorwayTop').set(3, 9, 'doorwayBottom');
  run(m, 'rafter', AT3.rafters[0], AT3.rafters[1], 5);
  column(m, 'ladder', AT3.ladder, 4, GROUND - 1);
  // hay bale stacks, and a lookout plank past the tallest
  for (const [a, b, top] of AT3.stacks) for (let x = a; x <= b; x++) column(m, 'bale', x, top, GROUND - 1);
  run(m, 'plank', AT3.lookout[0], AT3.lookout[1], 4);
  m.set(AT3.page, 3, 'page');
  // the purple NO, hung on a string by the hangar door
  m.set(24, 4, 'noN').set(25, 4, 'noO');
  // a plank over the goose lane
  run(m, 'plank', AT3.plankY[0], AT3.plankY[1], 8);
  for (const x of AT3.geese) m.mon(MONS.goose, x, GROUND - 1);
  // the letters
  for (const [ch, [x, y]] of Object.entries(AT3.letters)) m.set(x, y, `let${ch}`);
  // the windsock, clouds, the rack under its mast, the plane (its cockpit column is the exit)
  m.set(57, 7, 'sockTop').set(57, 8, 'sockPole').set(57, 9, 'sockPole');
  for (const [x, y] of [
    [27, 1],
    [46, 2],
    [62, 1],
    [78, 3],
  ])
    m.set(x, y, 'cloudL').set(x + 1, y, 'cloudR');
  column(m, 'mast', AT3.rack, 0, GROUND - 3);
  m.set(AT3.rack, GROUND - 2, 'rackTop').set(AT3.rack, GROUND - 1, 'rack');
  m.wallToSky(AT3.rack);
  for (let by = 0; by < PLANE.h; by++) for (let bx = 0; bx < PLANE.w; bx++) m.set(AT3.plane + bx, GROUND - PLANE.h + by, `plane${bx}${by}`);
  // placards
  m.sign(7, onGround(GROUND, s.start), s.start);
  m.sign(23, onGround(GROUND, s.no), s.no);
  m.sign(42, onGround(GROUND, s.geese), s.geese);
  m.sign(63, onGround(GROUND, s.rack), s.rack);
  m.sign(38, 0, s.secret);
  return { file: 'airstrip', title: 'Meanwhile', hint: 'Meanwhile, at the airstrip.', map: m, book, pal, hero: 'marge', song: 'marge' };
}
