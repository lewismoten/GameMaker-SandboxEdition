// TAILOR.BBL: the tailor's shop by lamplight ("I asked a tailor what thread feel feels"). Dark
// wood paneling, a plank floor, shelves and bolts of cloth, spools of thread to gather, threads
// hanging from the rafters to climb (no gravity), frayed places where he would step onto
// them that only a spool mends (solid until then), pins that prick, buttons to hop along, the sewing
// machine's table, needles standing taller than a camel with their eyes to crawl through (one
// is an eye gate), the poor seamstress, and the back door out into the night.
import { dither, Pixels } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import type { Pal } from '../art/pal';
import { THREAD } from '../ids';
import { addGate, addGoodThings, addSoul, GRAV, kit, LEDGE, SOLID, type Kit } from './common';

export function tailorBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, R, P, air } = k;

  // ---------- the room ----------
  // wood paneling (the "sky" ramp, lit by lamplight)
  const panel = (seed: number, k0 = 3) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 10 === 0 ? c('sky', k0 - 2) : shadeAt(R('sky'), k0 - 1, k0, 0.5 + Math.sin((y + seed * 3) / 3 + x / 9) * 0.25, x, y));
    return p;
  };
  k.sky = (seed: number, kk = 3) => panel(seed, kk);
  book.add('bg', panel(1), air);
  const dark = P().map((x, y) => (dither(x, y, 0.5) ? c('sky', 0) : c('sky', 1)));
  book.add('dark', dark, air);
  // the rafters (solid, the ceiling)
  const rafter = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) rafter.set(x, y, shadeAt(R('wood'), 0, 2, 0.4 + Math.sin(y / 2) * 0.2, x, y));
  rafter.rect(0, 17, 20, 3, c('wood', 0));
  book.add('rafter', rafter, { solid: SOLID });
  // the plank floor
  const floor = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) floor.set(x, y, y % 5 === 0 ? c('wood', 0) : shadeAt(R('wood'), 1, 3, 0.6 - y / 40 + ((x * 3 + Math.floor(y / 5) * 7) % 13) / 40, x, y));
  floor.rect(0, 0, 20, 1, c('wood', 4));
  book.add('floor', floor, { solid: SOLID });
  // a lamp on the wall, and a window onto the night (scenery)
  const lamp = panel(5);
  lamp.rect(9, 10, 3, 6, c('steel', 1)).rect(6, 15, 9, 2, c('steel', 2));
  blob(lamp, 10, 7, 3, 4, R('gold'), 2, 4);
  lamp.disc(10, 6, 1.6, c('white', 2));
  book.add('wallLamp', lamp, air);
  const win = panel(6);
  win.rect(2, 2, 16, 16, c('wood', 1)).rect(4, 4, 12, 12, c('blue', 0)).rect(9, 4, 2, 12, c('wood', 1)).rect(4, 9, 12, 2, c('wood', 1));
  win.set(6, 6, c('star', 2)).set(13, 13, c('star', 1)).set(14, 6, c('white', 2));
  book.add('window', win, air);

  // ---------- shelves, cloth, buttons ----------
  const shelf = panel(11);
  shelf.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
  shelf.line(2, 5, 6, 9, c('wood', 1)).line(17, 5, 13, 9, c('wood', 1));
  book.add('shelf', shelf, { solid: LEDGE, grav: GRAV.down });
  // bolts of cloth, stacked (solid)
  const bolt = (col: string) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R(col), 0, 3, 0.75 - Math.abs(y % 10 - 5) / 8, x, y));
    for (const y of [0, 10]) p.rect(0, y, 20, 1, c('ink', 1));
    p.disc(17, 5, 2, c(col, 0)).disc(17, 15, 2, c(col, 0));
    return p;
  };
  book.add('boltR', bolt('red'), { solid: SOLID });
  book.add('boltB', bolt('blue'), { solid: SOLID });
  book.add('boltP', bolt('purple'), { solid: SOLID });
  // a big button to stand on
  const button = (col: string) => {
    const p = panel(13);
    blob(p, 10, 6, 9.6, 4.4, R(col), 0, 3);
    for (const [x, y] of [[7, 5], [13, 5], [7, 8], [13, 8]]) p.disc(x, y, 1, c(col, 0));
    return p;
  };
  book.add('buttonR', button('red'), { solid: LEDGE, grav: GRAV.down });
  book.add('buttonG', button('gold'), { solid: LEDGE, grav: GRAV.down });
  // the tape measure, laid out as a bridge
  const tape = panel(15);
  tape.rect(0, 2, 20, 5, c('gold', 3)).rect(0, 2, 20, 1, c('gold', 4)).rect(0, 6, 20, 1, c('gold', 1));
  for (let x = 0; x < 20; x += 2) tape.rect(x, 3, 1, x % 10 === 0 ? 3 : 1, c('ink', 0));
  book.add('tape', tape, { solid: LEDGE, grav: GRAV.down });
  // the sewing machine's table (solid) and its iron treadle underneath (scenery)
  const table = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) table.set(x, y, shadeAt(R('wood'), 1, 3, 0.7 - y / 30, x, y));
  table.rect(0, 0, 20, 2, c('wood', 4));
  book.add('table', table, { solid: SOLID });
  const treadle = panel(17, 2);
  treadle.line(2, 0, 10, 19, c('grey', 1)).line(18, 0, 10, 19, c('grey', 1)).ring(10, 10, 5, c('grey', 2));
  book.add('treadle', treadle, air);
  // the machine itself, drawn whole (3 x 6 blocks) and cut: the head over the needle (the needle is
  // a monster that stabs down out of it), the arm, the pillar with its wheel, the bed on the table
  const machine = new Pixels(60, 120);
  for (let ty = 0; ty < 6; ty++) for (let tx = 0; tx < 3; tx++) machine.blit(panel(1), tx * 20, ty * 20);
  machine.rect(0, 112, 60, 8, c('ink', 1)).rect(0, 112, 60, 1, c('gold', 2)).rect(4, 115, 10, 1, c('steel', 1));
  machine.rect(42, 10, 14, 102, c('ink', 1)).rect(42, 10, 1, 102, c('ink', 2)).rect(42, 104, 14, 1, c('gold', 2));
  machine.rect(6, 4, 50, 11, c('ink', 1)).rect(6, 4, 50, 1, c('gold', 2)).rect(20, 8, 18, 1, c('gold', 3));
  machine.rect(1, 2, 16, 18, c('ink', 1)).rect(1, 2, 16, 1, c('gold', 2)).rect(3, 6, 1, 8, c('gold', 3));
  machine.rect(8, 18, 4, 2, c('steel', 1)).rect(9, 15, 2, 3, c('steel', 2));
  machine.ring(52, 30, 6, c('gold', 3)).disc(52, 30, 1.5, c('gold', 2)).line(52, 24, 52, 36, c('gold', 2));
  const machinePart = (tx: number, ty: number) => machine.crop(tx * 20, ty * 20, 20, 20);
  book.add('machine0', machinePart(0, 0), air);
  book.add('machine1', machinePart(1, 0), air);

  // ---------- thread ----------
  // a hanging thread: no gravity, climb it
  const threadPic = (fray: boolean) => {
    const p = panel(21);
    for (let y = 0; y < 20; y++) {
      const x = 10 + Math.round(Math.sin(y / 4) * 1.2);
      if (fray && y > 6 && y < 13) {
        p.set(x - 2 + (y % 3), y, c('red', 2)).set(x + 2 - (y % 2), y, c('red', 1));
        continue;
      }
      p.set(x, y, c('red', 3)).set(x + 1, y, c('red', 2));
    }
    return p;
  };
  book.add('thread', threadPic(false), { grav: GRAV.none });
  // frayed where he would step onto it: solid until a spool mends it (bump it to mend it)
  book.add('fray', threadPic(true), { solid: SOLID, effect: THREAD, eamt: -1, score: 100, touch: 'thread' });
  // a spool of thread: pick it up
  const spool = (col: string) => {
    const p = panel(23);
    p.rect(5, 4, 10, 2, c('wood', 3)).rect(5, 14, 10, 2, c('wood', 3)).rect(6, 6, 8, 8, c(col, 2));
    for (let y = 6; y < 14; y += 2) p.line(6, y, 13, y + 1, c(col, 3));
    p.line(14, 8, 18, 12, c(col, 2));
    return p;
  };
  book.add('spool', spool('red'), { effect: THREAD, eamt: 1, score: 50, touch: 'bg', grav: GRAV.down });
  book.add('spoolB', spool('blue'), { effect: THREAD, eamt: 1, score: 50, touch: 'bg', grav: GRAV.down });

  // ---------- pins and needles ----------
  // pins stuck up from a pincushion (solid, they prick)
  const pins = panel(31);
  blob(pins, 10, 16, 9, 5, R('red'), 1, 3);
  for (const [x, top] of [[4, 4], [8, 1], [12, 3], [16, 6]]) {
    pins.line(x, top + 2, x, 14, c('steel', 3));
    pins.disc(x, top + 1, 1.6, c(x % 8 === 0 ? 'gold' : 'blue', 3));
  }
  book.add('pins', pins, { solid: SOLID, hp: -6 });
  // a needle standing on its point, taller than a camel: the shaft (solid), its eye (a gap one block high)
  const shaft = (eyeRow: 'top' | 'bottom' | 'none') => {
    const p = panel(33);
    p.rect(5, 0, 10, 20, c('steel', 2)).rect(6, 0, 2, 20, c('steel', 3)).rect(13, 0, 2, 20, c('steel', 1));
    if (eyeRow === 'top') p.rect(5, 16, 10, 4, c('steel', 3)).rect(7, 18, 6, 2, c('steel', 0));
    if (eyeRow === 'bottom') p.rect(5, 0, 10, 4, c('steel', 3)).rect(7, 0, 6, 2, c('steel', 0));
    return p;
  };
  book.add('shaft', shaft('none'), { solid: SOLID });
  book.add('shaftOverEye', shaft('top'), { solid: SOLID });
  book.add('shaftUnderEye', shaft('bottom'), { solid: SOLID });
  // its eye: a hole right through, one block high
  const eye = panel(35, 2);
  eye.rect(0, 0, 3, 20, c('steel', 2)).rect(17, 0, 3, 20, c('steel', 1));
  for (let y = 0; y < 20; y++) eye.set(3, y, c('steel', 3)).set(16, y, c('steel', 0));
  book.add('eyeHole', eye, air);
  // the point, in the floorboards
  const point = panel(37);
  for (let y = 0; y < 20; y++) {
    const w = Math.round(5 - y / 4);
    point.rect(10 - w, y, w * 2, 1, c('steel', 2)).set(10 - w, y, c('steel', 3));
  }
  book.add('point', point, { solid: SOLID });
  // one needle's eye is an eye gate (a grace to open it)
  addGate(k, () => shaft('none'), () => eye.crop(0, 0, 20, 20), 'gate');

  // ---------- the poor, good things, the way out ----------
  for (const who of ['seamstress', 'widow', 'beggar'] as const) addSoul(k, who, () => panel(41));
  addGoodThings(k, () => panel(43));
  // the back door, open onto the night
  const door = (part: 'top' | 'bottom') => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x < 3 || x > 16 ? c('wood', 2) : c('blue', 0));
    if (part === 'top') {
      p.rect(0, 0, 20, 3, c('wood', 2));
      p.set(7, 8, c('star', 2)).set(12, 5, c('star', 1)).set(14, 12, c('star', 2));
    }
    return p;
  };
  book.add('doorTop', door('top'), air);
  book.add('door', door('bottom'), air);
  // robes hanging from the rafters on pegs, two blocks long (scenery)
  const robe = (col: string, part: number) => {
    const p = panel(47 + part);
    if (part === 0) p.line(10, 0, 10, 3, c('wood', 1)).line(4, 5, 16, 5, c('wood', 2));
    for (let y = part ? 0 : 5; y < (part ? 18 : 20); y++) {
      const w = 5 + (part ? 1 + y / 6 : (y - 5) / 6);
      for (let x = Math.round(10 - w); x <= Math.round(10 + w); x++) p.set(x, y, shadeAt(R(col), 0, 3, 0.8 - Math.abs(x - 10) / 12 - (x % 4 === 0 ? 0.2 : 0), x, y));
    }
    if (part) p.rect(4, 17, 13, 1, c('gold', 2));
    return p;
  };
  book.add('robe0', robe('purple', 0), air);
  book.add('robe1', robe('purple', 1), air);
  book.add('cloak0', robe('blue', 0), air);
  book.add('cloak1', robe('blue', 1), air);
  // a pile of scraps on the floor (scenery)
  const scraps = panel(45);
  speckle(scraps, 2, 14, 16, 6, R('purple'), 2, 1, 4, 0.5);
  for (let x = 3; x < 17; x += 4) scraps.rect(x, 13, 3, 2, c(x % 8 === 3 ? 'red' : 'gold', 2));
  book.add('scraps', scraps, air);
  // the rest of the sewing machine (added last, so the blocks before keep their numbers)
  book.add('machineArm', machinePart(2, 0), air);
  book.add('machineWheel', machinePart(2, 1), air);
  book.add('machinePillar', machinePart(2, 2), air);
  book.add('machineBedL', machinePart(0, 5), air);
  book.add('machineBed', machinePart(1, 5), air);
  book.add('machineBase', machinePart(2, 5), air);
  return k;
}
