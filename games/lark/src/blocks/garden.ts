// garden.bbl: the top-down blocks of chapter 9, the painted rocks: a little rock garden on a hill,
// gravel paths and grass, channels of raked sand between low stone walls (where the painted
// rocks roll), flower beds, the stone cubby Loaf #13 rolled into out of the rain (its door
// unlatches when every rock is back in its circle), Loaf himself, and the garden gate on.
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, shadeAt } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR, ROCKS } from '../ids';
import { loaf } from '../sprites/guests';
import { addKeepsakes } from './keepsakes';
import { BlockSet, SOLID } from './sets';
import { grass, hedge, noise, on, sign } from './tiles';

const O = () => c('ink', 0);

function gravel(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 3));
  const R = rng(seed);
  return p.map((x, y, v) => (R() < 0.4 ? shadeAt(r('stone'), 2, 4, R(), x, y) : v));
}

/** Raked sand: the channels the painted rocks roll along, combed in lines the long way. */
function sand(seed: number, along: 'ew' | 'ns'): Pixels {
  const p = noise(new Pixels(20, 20, c('brass', 2)), seed, 'brass', 1, 3, 0.2);
  for (let k = 2; k < 20; k += 4) {
    if (along === 'ew') p.rect(0, k, 20, 1, c('brass', 1));
    else p.rect(k, 0, 1, 20, c('brass', 1));
  }
  return p;
}

/** A low wall of fieldstone, knee-high to a robot. */
function lowWall(seed: number): Pixels {
  const p = gravel(seed + 20);
  const R = rng(seed);
  for (let i = 0; i < 6; i++) {
    const x = 1 + (i % 3) * 6 + Math.floor(R() * 2);
    const y = 2 + Math.floor(i / 3) * 9 + Math.floor(R() * 2);
    bevel(p, x, y, 6, 7, r('stone'), 2 + Math.floor(R() * 2));
  }
  return p;
}

/** A painted circle where a rock lives, empty: the rock's own picture painted small inside it, so you know whose it is. */
function circle(kind: number, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  const col = ['red', 'blue', 'green', 'purple'][kind];
  p.ring(10, 10, 8, c(col, 3)).ring(10, 10, 7, c(col, 2));
  return p;
}

function flowerBed(seed: number): Pixels {
  const p = noise(new Pixels(20, 20, c('wood', 1)), seed, 'wood', 0, 2, 0.4);
  const R = rng(seed);
  for (let i = 0; i < 7; i++) {
    const x = 2 + Math.floor(R() * 16);
    const y = 2 + Math.floor(R() * 16);
    p.rect(x, y + 1, 1, 3, c('green', 2));
    p.disc(x, y, 1.6, c(['pink', 'yellow', 'purple', 'red'][i % 4], 3));
  }
  return p;
}

/** The cubby's stone: big dressed blocks. */
function cubbyStone(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 1));
  const R = rng(seed);
  for (let y = 0; y < 20; y += 10) for (let x = (y / 10) % 2 ? -10 : 0; x < 20; x += 20) bevel(p, x + 1, y + 1, 18, 8, r('stone'), 2 + Math.floor(R() * 2));
  return p;
}

/** The cubby's door: latched (four little painted rock pictures on it, waiting) or swung open. */
function cubbyDoor(open: boolean, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(0, 0, 3, 20, c('stone', 2)).rect(17, 0, 3, 20, c('stone', 2));
  if (open) {
    p.rect(3, 0, 3, 20, c('wood', 3)).frame(3, 0, 3, 20, c('wood', 1));
    return p;
  }
  p.rect(3, 0, 14, 20, c('wood', 3));
  for (let y = 4; y < 20; y += 5) p.rect(3, y, 14, 1, c('wood', 1));
  ['red', 'blue', 'green', 'purple'].forEach((col, k) => p.disc(6 + (k % 2) * 8, 6 + Math.floor(k / 2) * 8, 2, c(col, 3)));
  return p;
}

/** The garden's wooden gate out, onto the road. */
function gardenGate(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(0, 0, 3, 20, c('wood', 2)).rect(17, 0, 3, 20, c('wood', 2));
  p.rect(3, 3, 3, 14, c('wood', 4));
  return p;
}

/** A birdbath, for something to look at. */
function birdbath(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(10, 10, 7, c('stone', 3)).disc(10, 10, 5, c('sky', 3)).disc(8, 8, 1.5, c('paper', 4));
  return p;
}

export function gardenSet(): BlockSet {
  const s = new BlockSet(150, false);
  const gv = gravel(1);
  const g = grass(31);
  s.add('gravel', gv);
  s.add('gravel2', gravel(2));
  s.add('grass', g);
  s.add('flowers', grass(32, true));
  s.add('hedge', hedge(7), { solid: SOLID });
  s.add('sandEW', sand(1, 'ew'));
  s.add('sandNS', sand(2, 'ns'));
  s.add('lowWall', lowWall(1), { solid: SOLID });
  s.add('lowWall2', lowWall(2), { solid: SOLID });
  for (let k = 0; k < ROCKS; k++) s.add(`circle${k}`, circle(k, gv));
  s.add('flowerBed', flowerBed(1), { solid: SOLID });
  s.add('cubby', cubbyStone(1), { solid: SOLID });
  s.add('cubbyIn', noise(new Pixels(20, 20, c('stone', 2)), 5, 'stone', 1, 3, 0.3));
  s.add('doorOpen', cubbyDoor(true, gv));
  s.add('door', cubbyDoor(false, gv), { solid: SOLID, effect: CTR.task, eamt: -ROCKS, touch: 'doorOpen' });
  s.add('loafGlad', on(s.pic('cubbyIn'), loaf('joy')));
  s.add('gardenGate', gardenGate(gv));
  s.add('birdbath', birdbath(g), { solid: SOLID });
  s.add('signRocks', sign('ROCKS', g), { solid: SOLID });
  s.add('ink', new Pixels(20, 20, O()), { solid: SOLID });
  addKeepsakes(s, gv, 'gravel', { heartStone: 'cubbyIn' });
  return s;
}
