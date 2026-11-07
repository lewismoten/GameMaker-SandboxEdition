// A graduation's first level, "the arrival": the walk across campus to the hall's doors. A path with trees,
// banners on poles and the hall's front at the far end, and along it a few nods (graduationNods.ts), small friendly
// moments that echo the stage's Starters, each with a sign naming its course. Nothing hurts and nothing traps.
// It has its own block set (arrive.bbl) beside the hall's, on the same palette. 13 rows high: the path is row 10.
//   x  2        where you start, with a welcome sign at x 4
//   x 10 ...    the nods, one after another (each takes `width` columns, its sign first)
//   at the end  the hall: its door is the way out, under a banner with the stage's name
import { courseNumber } from '../../../web/src/project/ceremonies';
import { Book } from './book';
import { addStarterBlocks } from './blocks';
import { cameoFrames } from './graduationCameo';
import { addCampusBlocks } from './graduationArriveArt';
import type { Graduation } from './graduationConfig';
import { NODS, type Nod, type NodCtx } from './graduationNods';
import type { Timed } from './graduationHall';
import { Grid } from './grid';
import { StarterMap, ORIGIN } from './map';
import type { Pal } from './palette';
import { addSign } from './sign';

export const ARRIVE_H = 13;
export const ARRIVE_FLOOR = 10;
const FIRST_NOD = 10;
const HALL_W = 9;

/** The arrival's file stem (arrive.map, arrive.bbl, arrive.gif). */
export const ARRIVE = 'arrive';

export interface Placed {
  nod: Nod;
  /** Its sign's left column; its feature starts at x + 5. */
  x: number;
  /** The course number on its sign (104, 211 ...), when the stage knows it. */
  course: number | undefined;
}

/** Where each nod goes, where the hall's front starts and how wide the level is. */
export function arrivalLayout(ids: readonly string[]): { placed: Placed[]; hall: number; width: number } {
  let x = FIRST_NOD;
  const placed = ids.map((id) => {
    const nod = NODS[id];
    if (!nod) throw new Error(`No nod called ${id}`);
    const p = { nod, x, course: courseNumber(nod.course) };
    x += nod.width;
    return p;
  });
  return { placed, hall: x, width: x + HALL_W + 1 };
}

/** The words on a nod's sign. */
export const nodSign = (p: Placed): string => `COURSE ${p.course ?? ''} ${p.nod.say}`.replace('  ', ' ');

/** The arrival's map and its block set (with the timed loops): everything buildLevels needs for the first level. */
export function buildArrival(cfg: Graduation, pal: Pal) {
  const book = new Book('bbl');
  const timed: Timed[] = [];
  addStarterBlocks(book, pal);
  addCampusBlocks(book, pal);
  const guest = cameoFrames(pal, cfg.cameos[0])[0].map((px, k) => {
    book.add(`guest.${k}`, px, { grav: 4 });
    return `guest.${k}`;
  });
  const ctx: NodCtx = { book, pal, timed, guest };
  const { placed, hall, width } = arrivalLayout(cfg.arrive.nods);
  const welcome = addSign(book, pal, 'welcome', cfg.arrive.welcome, 4, 2, true);
  const banner = addSign(book, pal, 'hallBanner', cfg.signs.banner, 4, 2, true);
  const signs = placed.map((p) => addSign(book, pal, `nod.${p.nod.id}`, nodSign(p), 4, 2, true));
  for (const p of placed) p.nod.blocks(ctx);

  const g = new Grid(width, ARRIVE_H);
  g.put(2, 9, 'S');
  const m = new StarterMap(book, g.rows());
  m.set(2, 9, 'sky');
  // the path, the earth under it and the hedges at both ends
  for (let x = 0; x < width; x++) {
    const end = x === 0 || x === width - 1;
    m.set(x, ARRIVE_FLOOR, end ? 'grass' : 'paving')
      .set(x, 11, 'dirt')
      .set(x, 12, 'dirt');
    if (end) for (let y = 0; y < ARRIVE_FLOOR; y++) m.set(x, y, 'edge');
  }
  // scenery first (a nod may stamp over it): a tree and a banner pole in each stretch, a cloud now and then
  placed.forEach((p, i) => {
    m.set(p.x + 4, 6, 'treeTop')
      .set(p.x + 4, 7, 'treeLow')
      .set(p.x + 4, 8, 'trunk')
      .set(p.x + 4, 9, 'trunk');
    const px = p.x + p.nod.width - 1;
    m.set(px, 6, i % 2 ? 'poleTop2' : 'poleTop')
      .set(px, 7, 'pole')
      .set(px, 8, 'pole')
      .set(px, 9, 'pole');
    if (i % 2 === 0) m.set(p.x + 1, 4, 'cloudL').set(p.x + 2, 4, 'cloudR');
  });
  m.sign(4, 7, welcome);
  placed.forEach((p, i) => {
    m.sign(p.x, 7, signs[i]);
    p.nod.place(m, p.x, ctx);
  });

  // the hall's front: roof, cornice, wall with columns and windows, the door and the banner over it
  for (let k = 0; k < HALL_W; k++) {
    const x = hall + k;
    m.set(x, 1, 'hallRoof').set(x, 2, 'hallCornice');
    for (let y = 3; y < 10; y++) m.set(x, y, [0, 3, 5, 8].includes(k) ? 'hallColumn' : 'hallWall');
    if ([1, 2, 6, 7].includes(k)) m.set(x, 6, 'hallWindow');
  }
  m.set(hall + 4, 8, 'hallDoorTop').set(hall + 4, 9, 'hallDoorBottom');
  banner.board.forEach((row, dy) => row.forEach((name, dx) => m.set(hall + 2 + dx, 4 + dy, name)));
  m.exits.push({ from: [hall + 4 + ORIGIN, 9 + ORIGIN] });
  return { book, timed, map: m, placed, hall, width };
}
