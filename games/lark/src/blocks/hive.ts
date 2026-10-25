// hive.bbl: the top-down blocks of chapter 8, open mic night at the Hive, a coffee house behind a
// little castle's front: plank floor and rugs, stone walls with tall windows, café tables, the
// counter with its espresso machine and pastry case, shelves of books, ceiling fans turning over
// the floor, the stage with its mic, the turret stair door (it opens for the pages caught on the
// floor), Will, his stage steps (they want the rest of his pages) and his corner by the curtain.
import { Pixels, rng } from '../../../kit/pixels';
import { willCameo } from '../../../kit/cameos';
import { bevel, shadeAt } from '../art/draw';
import { PAL, c, r } from '../art/pal';
import { CTR, FLOOR_PAGES, LOFT_PAGES } from '../ids';
import { addKeepsakes } from './keepsakes';
import { BlockSet, SOLID } from './sets';
import { ONE_WAY_SOUTH, addRope, on, swingGate, tiny } from './tiles';

const O = () => c('ink', 0);

function planks(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 3));
  const R = rng(seed);
  for (let x = 0; x < 20; x += 5) {
    p.rect(x, 0, 1, 20, c('wood', 1));
    const joint = Math.floor(R() * 20);
    p.rect(x, joint, 5, 1, c('wood', 2));
  }
  p.map((_x, _y, v) => (R() < 0.08 ? c('wood', 4) : v));
  return p;
}

function rug(seed: number): Pixels {
  const p = new Pixels(20, 20, c('red', 1));
  p.map((x, y) => ((x + y + seed) % 6 < 2 ? c('red', 2) : (x - y + 40) % 6 < 1 ? c('brass', 2) : c('red', 1)));
  return p;
}

function stone(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 2));
  const R = rng(seed);
  for (let y = 0; y < 20; y += 7) for (let x = (y / 7) % 2 ? -5 : 0; x < 20; x += 10) bevel(p, x + 1, y + 1, 9, 6, r('stone'), 2 + Math.floor(R() * 2));
  return p;
}

/** A tall castle window in the wall, warm light through it. */
function castleWindow(): Pixels {
  const p = stone(3);
  p.rect(6, 3, 8, 15, c('window', 2)).disc(10, 5, 4, c('window', 2));
  p.rect(9, 3, 2, 15, c('wood', 1)).rect(6, 10, 8, 1, c('wood', 1));
  return p;
}

/** The castle's front door (the way back out to the road). */
function castleDoor(): Pixels {
  const p = planks(5);
  p.rect(2, 0, 16, 20, c('stone', 3)).rect(4, 0, 12, 20, c('wood', 2));
  for (let y = 3; y < 20; y += 5) p.rect(4, y, 12, 1, c('ink', 1));
  p.disc(13, 10, 1, c('brass', 3));
  return p;
}

/** A little round café table from above, with two cups. */
function table(ground: Pixels, seed: number): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(11, 11, 7, c('ink', 1)).disc(10, 10, 7, c('wood', 4)).ring(10, 10, 7, c('wood', 2));
  const R = rng(seed);
  for (let i = 0; i < 2; i++) {
    const x = 6 + Math.floor(R() * 8);
    const y = 6 + Math.floor(R() * 8);
    p.disc(x, y, 2, c('paper', 4)).disc(x, y, 1, c('wood', 1));
  }
  return p;
}

/** The counter, with the espresso machine (steam!) or the pastry case, or plain. */
function counter(kind: 'plain' | 'espresso' | 'pastry'): Pixels {
  const p = new Pixels(20, 20, c('wood', 2));
  bevel(p, 0, 0, 20, 20, r('wood'), 2);
  p.rect(0, 16, 20, 4, c('wood', 1));
  if (kind === 'espresso') {
    p.rect(3, 2, 14, 10, c('stone', 4)).frame(3, 2, 14, 10, O()).rect(5, 4, 4, 3, c('red', 2));
    p.disc(13, 6, 2, c('stone', 2)).rect(7, 12, 6, 2, c('ink', 1));
    p.set(15, 0, c('paper', 4)).set(16, 1, c('paper', 3));
  } else if (kind === 'pastry') {
    p.rect(2, 2, 16, 12, c('blue', 4)).frame(2, 2, 16, 12, c('stone', 3));
    for (const [x, y] of [
      [5, 5],
      [10, 6],
      [14, 5],
      [7, 10],
      [13, 10],
    ])
      p.disc(x, y, 2, c('brass', 3)).set(x, y - 1, c('brass', 4));
  }
  return p;
}

function bookshelf(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  const R = rng(seed);
  for (let y = 1; y < 20; y += 6) {
    for (let x = 1; x < 19;) {
      const w = 2 + Math.floor(R() * 2);
      const col = ['red', 'blue', 'green', 'purple', 'brass'][Math.floor(R() * 5)];
      p.rect(x, y, w, 5, c(col, 2)).rect(x, y, w, 1, c(col, 3));
      x += w;
    }
    p.rect(0, y + 5, 20, 1, c('wood', 3));
  }
  return p;
}

/** A ceiling fan's shadow turning on the floor (two frames); the pages go round under them. */
function fanShadow(frame: number, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  const a0 = frame ? Math.PI / 4 : 0;
  for (let k = 0; k < 4; k++) {
    const a = a0 + (k * Math.PI) / 2;
    for (let t = 2; t < 9; t++) {
      const x = Math.round(10 + Math.cos(a) * t);
      const y = Math.round(10 + Math.sin(a) * t);
      p.set(x, y, c('wood', 1)).set(x + 1, y, c('wood', 1));
    }
  }
  p.disc(10, 10, 2, c('wood', 1));
  return p;
}

/** The stage's boards: dark, a spotlight's warm circle on some. */
function stage(lit: boolean): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  for (let y = 0; y < 20; y += 4) p.rect(0, y, 20, 1, c('wood', 0));
  if (lit) p.map((x, y, v) => ((x - 10) ** 2 + (y - 10) ** 2 < 70 ? shadeAt(r('window'), 0, 1, 0.6, x, y) : v));
  return p;
}

function curtain(): Pixels {
  const p = new Pixels(20, 20, c('red', 1));
  for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 20, c('red', 2));
  p.rect(0, 17, 20, 3, c('brass', 2));
  return p;
}

/** The mic on its stand, from above. */
function mic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(10, 14, 4, c('ink', 0)).line(10, 14, 10, 5, c('stone', 3));
  p.disc(10, 4, 2.5, c('stone', 4)).disc(9, 3, 1, c('paper', 4));
  return p;
}

/** The chalkboard by the door: OPEN MIC. */
function chalkboard(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(2, 2, 16, 14, c('wood', 2)).rect(3, 3, 14, 12, c('ink', 1));
  tiny(p, 4, 4, 'OPEN', c('paper', 4));
  tiny(p, 6, 10, 'MIC', c('paper', 4));
  return p;
}

/** The turret stair door: shut (it wants the pages caught on the floor first) or open on the stair. */
function turretDoor(open: boolean): Pixels {
  const p = stone(9);
  if (open) {
    p.rect(4, 2, 12, 18, c('ink', 0));
    for (let y = 4; y < 20; y += 4) p.rect(5, y, 10, 2, c('stone', 3));
    return p;
  }
  p.rect(4, 2, 12, 18, c('wood', 2)).disc(10, 4, 6, c('wood', 2)).rect(4, 4, 12, 16, c('wood', 2));
  for (let y = 6; y < 20; y += 5) p.rect(4, y, 12, 1, c('wood', 1));
  // a page pinned on it: the ones on the floor first
  p.rect(7, 8, 6, 7, c('paper', 4)).rect(8, 10, 4, 1, c('ink', 1)).rect(8, 12, 3, 1, c('ink', 1));
  return p;
}

/** The steps up onto the stage: roped off until every page is back. */
function stageSteps(open: boolean): Pixels {
  const p = stage(false);
  for (let k = 0; k < 3; k++) p.rect(1, 3 + k * 6, 18, 4, c('wood', 3 - (k % 2))).rect(1, 3 + k * 6, 18, 1, c('wood', 4));
  if (!open) {
    p.disc(3, 10, 2, c('brass', 3)).disc(16, 10, 2, c('brass', 3));
    p.rect(4, 9, 12, 1, c('purple', 3)).rect(4, 10, 12, 1, c('purple', 2));
    p.rect(7, 11, 6, 6, c('paper', 4)).rect(8, 13, 4, 1, c('ink', 1));
  }
  return p;
}

/** Will, as his own game draws him. */
const will = (mood: 'worry' | 'swoon' | 'calm', arms: 'clutch' | 'heart' | 'down') => willCameo(PAL.pal, { face: 'front', mood, arms });

export function hiveSet(): BlockSet {
  const s = new BlockSet(150, false);
  const fl = planks(1);
  const st = stage(false);
  s.add('floor', fl);
  s.add('floor2', planks(2));
  s.add('rug', rug(0));
  s.add('rug2', rug(3));
  s.add('stone', stone(1), { solid: SOLID });
  s.add('stone2', stone(2), { solid: SOLID });
  s.add('castleWindow', castleWindow(), { solid: SOLID });
  s.add('castleDoor', castleDoor());
  s.add('table', table(fl, 1), { solid: SOLID });
  s.add('table2', table(fl, 2), { solid: SOLID });
  s.add('counter', counter('plain'), { solid: SOLID });
  s.add('espresso', counter('espresso'), { solid: SOLID });
  s.add('pastry', counter('pastry'), { solid: SOLID });
  s.add('books', bookshelf(1), { solid: SOLID });
  s.add('books2', bookshelf(2), { solid: SOLID });
  s.add('fan', fanShadow(0, fl), { next: 'fan2', ntime: 3 });
  s.add('fan2', fanShadow(1, fl), { next: 'fan', ntime: 3 });
  s.add('stage', st);
  s.add('stageLit', stage(true));
  s.add('curtain', curtain(), { solid: SOLID });
  s.add('mic', mic(stage(true)), { solid: SOLID });
  s.add('chalkboard', chalkboard(fl), { solid: SOLID });
  s.add('turretOpen', turretDoor(true));
  s.add('turret', turretDoor(false), { solid: SOLID, effect: CTR.task, eamt: -FLOOR_PAGES, touch: 'turretOpen' });
  s.add('stepsOpen', stageSteps(true));
  s.add('steps', stageSteps(false), { solid: SOLID, effect: CTR.task, eamt: -LOFT_PAGES, touch: 'stepsOpen' });
  s.add('will', on(fl, will('worry', 'clutch')));
  s.add('willGlad', on(stage(true), will('swoon', 'heart')));
  addRope(s, st, 8);
  s.add('swing8', swingGate(st), { solid: ONE_WAY_SOUTH });
  addKeepsakes(s, fl, 'floor', { umbrella: 'stage' });
  return s;
}
