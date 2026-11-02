// The five base block sets, drawn in the scenery roles only (palette.ts), so each scene's .PAL
// recolors them: GARAGE (Jump Start, Brake Dance, Muffled), ENGINE (the engine bay), CURB, CAB
// and PARADE. A level's set starts with its base set in the same slots and adds its own blocks.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel, blob, gradient, speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { AIR, LEDGE, SOLID, type Kit } from './common';

export type SetName = 'garage' | 'engine' | 'curb' | 'cab' | 'parade';

/** A bolt head. */
const bolt = (k: Kit, p: Pixels, x: number, y: number) => p.rect(x, y, 2, 2, k.c('mach', 4)).set(x + 1, y + 1, k.c('mach', 1));

/** GARAGE: the pegboard wall, its window, the slab floor, the workbench, shelves, tires, a drum, the tool chest. */
function garage(k: Kit): void {
  const { book, c, R, P } = k;
  const wall = (seed: number) => {
    const p = P(c('wall', 3));
    speckle(p, 0, 0, 20, 20, R('wall'), 3, 1, seed, 0.12);
    // pegboard holes
    for (let y = 2; y < 20; y += 5) for (let x = 2; x < 20; x += 5) p.set(x, y, c('wall', 1));
    return p;
  };
  book.add('wall', wall(1), AIR);
  const pegs = wall(2);
  // a hook with a coil of hose and a hanging hand pump (no wrenches: Gwinn buried those)
  p_hose(k, pegs);
  book.add('wall.pegs', pegs, AIR);
  const win = wall(3);
  win.rect(2, 2, 16, 16, c('mach', 1));
  gradient(win, 3, 3, 14, 14, R('lamp'), 1, 4);
  win.rect(9, 3, 2, 14, c('mach', 1)).rect(3, 9, 14, 2, c('mach', 1));
  book.add('window', win, AIR);
  const floor = (top: boolean) => {
    const p = P(c('floor', 2));
    speckle(p, 0, 0, 20, 20, R('floor'), 2, 1, top ? 4 : 5, 0.2);
    if (top) p.rect(0, 0, 20, 2, c('floor', 4)).rect(0, 2, 20, 1, c('floor', 1));
    return p;
  };
  book.add('floor', floor(true), { solid: SOLID });
  book.add('slab', floor(false), { solid: SOLID });
  // the workbench: a thick wooden top to stand on, legs and a shelf under it
  const bench = wall(6);
  bevel(bench, 0, 0, 20, 5, R('pipe'), 3);
  book.add('bench', bench, { solid: LEDGE, ...AIR });
  const legs = wall(7);
  legs.rect(1, 0, 3, 20, c('pipe', 1)).rect(16, 0, 3, 20, c('pipe', 1)).rect(1, 12, 18, 2, c('pipe', 2));
  book.add('bench.legs', legs, AIR);
  // a shelf bracketed to the wall
  const shelf = wall(8);
  shelf.rect(0, 0, 20, 3, c('mach', 4)).rect(0, 3, 20, 1, c('mach', 1)).line(3, 4, 7, 8, c('mach', 2)).line(16, 4, 12, 8, c('mach', 2));
  book.add('shelf', shelf, { solid: LEDGE, ...AIR });
  // a stack of tires: solid, a black donut a block
  const tire = P(c('wall', 3));
  blob(tire, 10, 10, 10, 8, R('shade'), 0, 3);
  tire.rect(2, 9, 16, 2, c('shade', 0));
  tire.rect(5, 4, 10, 1, c('shade', 3));
  book.add('tire', tire, { solid: SOLID });
  // an oil drum (solid): the scene's paint color, two ribs
  const drum = wall(9);
  bevel(drum, 2, 1, 16, 19, R('accent'), 2);
  drum.rect(2, 6, 16, 1, c('accent', 0)).rect(2, 14, 16, 1, c('accent', 0));
  drum.rect(4, 9, 6, 3, c('accent', 4));
  book.add('drum', drum, { solid: SOLID });
  // the rolling tool chest (solid): drawers
  const chest = wall(10);
  bevel(chest, 1, 0, 18, 20, R('mach'), 3);
  for (let y = 3; y < 20; y += 5) chest.rect(3, y, 14, 3, c('mach', 2)).rect(8, y + 1, 4, 1, c('mach', 5));
  book.add('chest', chest, { solid: SOLID });
  // wall dressing, all passable: a shadow board two blocks wide (a hammer, a hose, and the
  // painted shapes of wrenches with nothing on them), THE CHEZ's charger with its cord coiled
  // under it, and a shop light hung from the ceiling
  const board = (left: boolean) => {
    const p = wall(left ? 11 : 12);
    p.rect(left ? 2 : 0, 2, 18, 16, c('wall', 2))
      .rect(left ? 2 : 0, 2, 18, 1, c('wall', 1))
      .rect(left ? 2 : 0, 17, 18, 1, c('wall', 1));
    p.rect(left ? 2 : 17, 2, 1, 16, c('wall', 1));
    const wrench = (x: number, h: number) =>
      p
        .disc(x, 5, 2, c('shade', 1))
        .rect(x - 1, 6, 3, h, c('shade', 1))
        .disc(x, 6 + h, 2, c('shade', 1))
        .set(x, 4, c('wall', 2))
        .set(x, 7 + h, c('wall', 2));
    if (left) {
      p.rect(7, 6, 2, 10, c('pipe', 2)).rect(4, 4, 8, 3, c('mach', 4)).rect(4, 6, 8, 1, c('mach', 2));
      wrench(15, 8);
    } else {
      wrench(3, 7);
      p.rect(10, 3, 2, 2, c('mach', 2));
      for (let r = 3; r <= 5; r++) p.ring(11, 10, r, c('shade', r === 5 ? 0 : 2));
    }
    return p;
  };
  book.add('board.l', board(true), AIR);
  book.add('board.r', board(false), AIR);
  const charger = wall(13);
  charger.rect(9, 0, 2, 3, c('mach', 2));
  charger.rect(4, 3, 12, 10, c('mach', 5)).frame(4, 3, 12, 10, c('mach', 1)).rect(7, 5, 6, 2, c('lamp', 3));
  charger.line(11, 8, 9, 10, c('lamp', 4)).line(9, 10, 11, 10, c('lamp', 4));
  charger.rect(9, 13, 2, 2, c('shade', 0));
  charger.ring(10, 17, 2, c('shade', 0)).ring(10, 17, 3, c('shade', 1));
  book.add('charger', charger, AIR);
  const light = wall(14);
  light.line(5, 0, 5, 5, c('mach', 1)).line(14, 0, 14, 5, c('mach', 1));
  light.rect(1, 6, 18, 3, c('mach', 4)).rect(1, 6, 18, 1, c('mach', 5)).rect(2, 9, 16, 2, c('lamp', 4));
  for (let x = 3; x < 18; x += 3) light.set(x, 12, c('lamp', 3));
  book.add('light', light, AIR);
}

/** A coil of hose on a peg. */
function p_hose(k: Kit, p: Pixels): void {
  const { c } = k;
  p.rect(9, 2, 2, 3, c('mach', 2));
  for (let r = 4; r <= 7; r++) p.ring(10, 11, r, c('shade', r === 7 ? 0 : 2));
}

/** ENGINE: the engine block's dark face, its ribs and bolts, metal ledges and a solid casting. */
function engine(k: Kit): void {
  const { book, c, R, P } = k;
  const bay = (seed: number) => {
    const p = P(c('wall', 1));
    speckle(p, 0, 0, 20, 20, R('wall'), 1, 1, seed, 0.15);
    return p;
  };
  book.add('bay', bay(1), AIR);
  const ribs = bay(2);
  for (let x = 2; x < 20; x += 6) ribs.rect(x, 0, 2, 20, c('wall', 2)).rect(x + 2, 0, 1, 20, c('wall', 0));
  book.add('bay.ribs', ribs, AIR);
  const bolts = bay(3);
  bolt(k, bolts, 4, 4);
  bolt(k, bolts, 14, 14);
  book.add('bay.bolts', bolts, AIR);
  // a run of pipe behind (the scenery's pipe color)
  const run = bay(4);
  run.rect(0, 7, 20, 6, c('pipe', 2)).rect(0, 7, 20, 1, c('pipe', 4)).rect(0, 12, 20, 1, c('pipe', 0));
  book.add('bay.pipe', run, AIR);
  // the casting: solid metal, beveled
  const cast = P();
  bevel(cast, 0, 0, 20, 20, R('mach'), 3);
  bolt(k, cast, 3, 3);
  bolt(k, cast, 15, 15);
  book.add('casting', cast, { solid: SOLID });
  const top = P();
  bevel(top, 0, 0, 20, 20, R('mach'), 3);
  top.rect(0, 0, 20, 2, c('mach', 6)).rect(0, 2, 20, 1, c('mach', 1));
  book.add('casting.top', top, { solid: SOLID });
  // a ledge: a metal bracket to stand on
  const ledge = bay(5);
  ledge.rect(0, 0, 20, 4, c('mach', 4)).rect(0, 0, 20, 1, c('mach', 6)).rect(0, 4, 20, 1, c('mach', 0));
  bolt(k, ledge, 3, 1);
  bolt(k, ledge, 15, 1);
  book.add('ledge', ledge, { solid: LEDGE, ...AIR });
  // the deep dark under the engine
  book.add('deep', P(c('shade', 0)), { solid: SOLID });
}

/** CURB: sky, the sidewalk, the curb's edge, a street, a hedge. */
function curb(k: Kit): void {
  const { book, c, R, P } = k;
  const sky = P();
  gradient(sky, 0, 0, 20, 20, R('wall'), 2, 4);
  book.add('sky', sky, AIR);
  const walk = P(c('floor', 3));
  for (let x = 0; x < 20; x += 10) walk.rect(x, 0, 1, 20, c('floor', 1));
  walk.rect(0, 0, 20, 2, c('floor', 4));
  book.add('walk', walk, { solid: SOLID });
  const edge = P(c('floor', 2));
  edge.rect(0, 0, 20, 4, c('floor', 4)).rect(0, 4, 20, 2, c('floor', 1));
  book.add('curb', edge, { solid: SOLID });
  const street = P(c('shade', 2));
  speckle(street, 0, 0, 20, 20, R('shade'), 2, 1, 7, 0.2);
  book.add('street', street, { solid: SOLID });
  const hedge = P();
  gradient(hedge, 0, 0, 20, 20, R('wall'), 2, 4);
  const r = rng(11);
  for (let i = 0; i < 9; i++) blob(hedge, 2 + r() * 16, 6 + r() * 12, 4, 4, R('pipe'), 0, 4);
  book.add('hedge', hedge, AIR);
}

/** CAB: the dashboard's vinyl, the windshield, its frame, a gauge face. */
function cab(k: Kit): void {
  const { book, c, R, P } = k;
  const glass = P();
  gradient(glass, 0, 0, 20, 20, R('wall'), 1, 4);
  book.add('glass', glass, AIR);
  const dash = P(c('mach', 1));
  speckle(dash, 0, 0, 20, 20, R('mach'), 1, 1, 3, 0.2);
  dash.rect(0, 0, 20, 2, c('mach', 3));
  book.add('dash', dash, { solid: SOLID });
  const frame = P(c('shade', 1));
  frame.rect(0, 0, 4, 20, c('shade', 3));
  book.add('pillar', frame, { solid: SOLID });
  const gauge = P(c('mach', 1));
  gauge.disc(10, 10, 8, c('mach', 0)).disc(10, 10, 7, c('lamp', 2));
  gauge.line(10, 10, 15, 6, c('accent', 2));
  book.add('gauge', gauge, { solid: SOLID });
}

/** PARADE: sky, bunting, the road, the crowd's barrier. */
function parade(k: Kit): void {
  const { book, c, R, P } = k;
  const sky = P();
  gradient(sky, 0, 0, 20, 20, R('wall'), 2, 4);
  book.add('sky', sky, AIR);
  const bunting = P();
  gradient(bunting, 0, 0, 20, 20, R('wall'), 2, 4);
  bunting.line(0, 2, 20, 4, c('shade', 1));
  for (const [x, ramp] of [
    [1, 'accent'],
    [8, 'lamp'],
    [15, 'pipe'],
  ] as const)
    for (let y = 0; y < 7; y++) bunting.rect(x + Math.floor(y / 2), 3 + y, 6 - y, 1, c(ramp, 3));
  book.add('bunting', bunting, AIR);
  const road = P(c('floor', 1));
  road.rect(0, 9, 8, 2, c('lamp', 4));
  book.add('road', road, { solid: SOLID });
  const rail = P();
  gradient(rail, 0, 0, 20, 20, R('wall'), 2, 4);
  rail.rect(0, 8, 20, 3, c('accent', 2)).rect(2, 8, 2, 12, c('mach', 3)).rect(16, 8, 2, 12, c('mach', 3));
  book.add('barrier', rail, AIR);
}

const SETS: Record<SetName, (k: Kit) => void> = { garage, engine, curb, cab, parade };

/** Puts base set `name` into a level's fresh book (it must be empty: the base blocks keep their slots). */
export function baseSet(k: Kit, name: SetName): void {
  if (k.book.index.size) throw new Error(`base set ${name} must come first`);
  SETS[name](k);
}

export const SET_NAMES = Object.keys(SETS) as SetName[];
