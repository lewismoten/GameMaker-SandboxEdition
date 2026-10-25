// town.bbl: the top-down blocks of the library, the Long Road and the town square, seen from
// above as Joe walks them a block a step. Floors and grass, walls and shelves, the friends who
// talk (walk onto them), the gates that count, and the cells of the pass map the talks use.
import { Pixels, rng } from '../../../kit/pixels';
import { bevel } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR, LEG1_THANKS } from '../ids';
import { clown, leo, reggie } from '../sprites/people';
import { addKeepsakes } from './keepsakes';
import { BlockSet, SOLID } from './sets';
import { ONE_WAY_SOUTH, addRope, barrier, cobble, fence, gate, grass, hedge, lampPost, noise, on, parkBench, path, sign, swingGate, tree } from './tiles';

const O = () => c('ink', 0);

// ------------------------------------------------------------------ floors

function boards(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 3));
  for (let y = 0; y < 20; y += 5) {
    p.rect(0, y, 20, 1, c('wood', 1));
    const joint = (y * 7 + seed * 5) % 20;
    p.rect(joint, y, 1, 5, c('wood', 1));
  }
  return noise(p, seed, 'wood', 2, 4, 0.18);
}

function rug(): Pixels {
  const p = new Pixels(20, 20, c('red', 1));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 6 === 0 || (x - y + 40) % 6 === 0) p.set(x, y, c('red', 2));
  for (let y = 2; y < 20; y += 6) for (let x = 2; x < 20; x += 6) p.set(x, y, c('brass', 3));
  return p;
}

// ------------------------------------------------------------------ walls and furniture

function panel(): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  bevel(p, 1, 1, 18, 18, r('wood'), 2);
  p.rect(4, 4, 12, 12, c('wood', 1)).frame(4, 4, 12, 12, c('wood', 0));
  return p;
}

function window(): Pixels {
  const p = panel();
  p.rect(3, 3, 14, 12, c('dusk', 0));
  p.set(6, 5, c('paper', 4)).set(13, 8, c('paper', 3)).set(9, 11, c('paper', 4));
  p.disc(13, 6, 2, c('window', 2)).disc(14, 5, 1.5, c('dusk', 0));
  p.rect(9, 3, 1, 12, c('wood', 2)).rect(3, 8, 14, 1, c('wood', 2));
  return p;
}

/** A bookcase from above: the shelf's top edge and rows of spines, every book a different color. */
function shelf(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 2));
  const R = rng(seed);
  const cols = ['red', 'blue', 'green', 'brass', 'purple', 'paper'];
  for (const y0 of [2, 11]) {
    let x = 1;
    while (x < 19) {
      const w = 1 + Math.floor(R() * 2);
      const col = cols[Math.floor(R() * cols.length)];
      p.rect(x, y0, w, 7, c(col, 2)).rect(x, y0, w, 1, c(col, 3));
      x += w + (R() < 0.15 ? 1 : 0);
    }
  }
  p.rect(0, 0, 20, 2, c('wood', 4)).rect(0, 9, 20, 2, c('wood', 3)).rect(0, 18, 20, 2, c('wood', 1));
  return p;
}

function desk(): Pixels {
  const p = boards(4);
  bevel(p, 0, 2, 20, 16, r('wood'), 4);
  p.rect(3, 5, 7, 5, c('paper', 4)).rect(4, 6, 5, 1, c('ink', 1)).rect(4, 8, 4, 1, c('ink', 1));
  p.rect(13, 7, 4, 4, c('green', 2)).frame(13, 7, 4, 4, O());
  return p;
}

function lamp(): Pixels {
  const p = desk();
  p.disc(14, 9, 5, c('window', 1));
  p.disc(14, 9, 3, c('window', 2)).disc(14, 9, 1.5, c('yellow', 3));
  p.rect(13, 14, 3, 2, c('brass', 1));
  return p;
}

/** Joe's workbench: a vise, a hammer, and the last tin hearts he made, in a row (his own style). */
function bench(seed: number): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  bevel(p, 0, 1, 20, 18, r('wood'), 3);
  const R = rng(seed);
  for (let i = 0; i < 3; i++) {
    const x = 2 + i * 6;
    const y = 4 + Math.floor(R() * 6);
    // a little riveted heart, scenery only (no clock face: not the hidden kind)
    p.rect(x, y, 2, 2, c('tin', 3)).rect(x + 3, y, 2, 2, c('tin', 3));
    p.rect(x, y + 1, 5, 2, c('tin', 3))
      .rect(x + 1, y + 3, 3, 1, c('tin', 2))
      .set(x + 2, y + 4, c('tin', 2));
    p.set(x, y, c('tin', 5)).set(x + 3, y, c('tin', 5));
  }
  p.rect(1, 15, 7, 2, c('stone', 2)).rect(2, 14, 2, 1, c('wood', 4));
  return p;
}

function stool(): Pixels {
  const p = boards(2);
  p.disc(10, 10, 5, c('wood', 4)).ring(10, 10, 5, c('wood', 1));
  return p;
}

/** The storybook on the rug, open: a tin woodman on the left page, words on the right. */
function storybook(): Pixels {
  const p = rug();
  p.rect(3, 5, 14, 10, c('paper', 4)).frame(3, 5, 14, 10, c('wood', 1));
  p.rect(10, 5, 1, 10, c('paper', 2));
  // the tin woodman: a funnel hat and a little round body
  p.rect(6, 6, 1, 2, c('tin', 3)).rect(5, 8, 3, 2, c('tin', 3)).rect(5, 10, 3, 3, c('tin', 2));
  for (const y of [7, 9, 11, 13]) p.rect(12, y, 4, 1, c('ink', 1));
  return p;
}

function door(): Pixels {
  const p = panel();
  p.rect(4, 1, 12, 19, c('red', 2)).frame(4, 1, 12, 19, c('red', 0));
  p.rect(6, 3, 8, 6, c('red', 3)).rect(6, 11, 8, 6, c('red', 3));
  // a paw-print knob
  p.disc(13, 12, 1.2, c('brass', 3));
  return p;
}

// ------------------------------------------------------------------ the road

/** The Dog House, 2x2: a white library box with a dark roof and a red door, seen from above and in front. */
function dogHouse(part: 0 | 1 | 2 | 3, ground: Pixels): Pixels {
  const big = new Pixels(40, 40);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) big.set(x, y, ground.get(x % 20, y % 20));
  // roof
  for (let y = 2; y < 16; y++) big.rect(4 + Math.max(0, 8 - y), y, 32 - 2 * Math.max(0, 8 - y), 1, y < 9 ? c('ink', 1) : c('stone', 1));
  big.rect(2, 15, 36, 2, c('ink', 0));
  // white box and red door with dog books inside
  big.rect(6, 17, 28, 18, c('paper', 4)).frame(6, 17, 28, 18, c('stone', 2));
  big.rect(12, 19, 16, 14, c('red', 2)).frame(12, 19, 16, 14, c('red', 0));
  big.rect(14, 21, 12, 10, c('blue', 1));
  for (let x = 15; x < 25; x += 2) big.rect(x, 23, 1, 7, c(['brass', 'green', 'pink', 'paper', 'purple'][(x - 15) / 2], 3));
  // post
  big.rect(18, 35, 4, 5, c('wood', 2));
  return big.crop((part % 2) * 20, part < 2 ? 0 : 20, 20, 20);
}

// ------------------------------------------------------------------ the square

function towerWall(): Pixels {
  const p = new Pixels(20, 20, c('brick', 1));
  for (let y = 0; y < 20; y += 5) for (let x = (y / 5) % 2 ? -5 : 0; x < 20; x += 10) p.rect(x + 1, y + 1, 9, 4, c('brick', 2 + ((x + y) % 3 === 0 ? 1 : 0)));
  return p;
}

/** The clock's face on the tower, at `h`:`m`. */
function clockFace(h: number, m: number): Pixels {
  const p = towerWall();
  p.disc(10, 10, 9, c('brass', 1)).disc(10, 10, 8, c('paper', 4));
  for (let k = 0; k < 12; k++) p.set(10 + Math.round(Math.sin((k * Math.PI) / 6) * 7), 10 - Math.round(Math.cos((k * Math.PI) / 6) * 7), c('ink', 1));
  const hand = (a: number, len: number, col: number) => p.line(10, 10, 10 + Math.sin(a) * len, 10 - Math.cos(a) * len, col);
  hand(((h % 12) + m / 60) * (Math.PI / 6), 4, c('ink', 0));
  hand((m / 60) * Math.PI * 2, 6, c('red', 1));
  p.set(10, 10, c('brass', 3));
  return p;
}

function towerDoor(): Pixels {
  const p = towerWall();
  p.rect(4, 4, 12, 16, c('ink', 0));
  p.disc(10, 5, 6, c('ink', 0));
  p.rect(5, 6, 10, 14, c('wood', 1));
  p.rect(9, 6, 1, 14, c('wood', 0));
  p.rect(5, 18, 10, 2, c('stone', 2));
  return p;
}

/** Half of the parade float the Clown Club built: bunting, balloons and a painted big top. */
function float(half: 0 | 1, ground: Pixels): Pixels {
  const big = new Pixels(40, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) big.set(x, y, ground.get(x % 20, y));
  big.rect(1, 3, 38, 14, c('purple', 2)).frame(1, 3, 38, 14, O());
  for (let x = 2; x < 38; x += 6) big.rect(x, 3, 3, 14, c('purple', 3));
  for (let x = 3; x < 38; x += 4) big.set(x, 4, c('yellow', 3)).set(x + 1, 5, c('red', 3));
  for (const [x, col] of [
    [8, 'red'],
    [20, 'blue'],
    [31, 'yellow'],
  ] as const)
    big.disc(x, 10, 3, c(col, 3)).set(x - 1, 9, c('paper', 4));
  return big.crop(half * 20, 0, 20, 20);
}

// ------------------------------------------------------------------ the set

export function townSet(): BlockSet {
  const s = new BlockSet(150, false);
  const g = grass(1);
  const cb = cobble(1);
  // the pass map's cells first (all black under a black palette; what they give is the point)
  s.add('void', new Pixels(20, 20, c('ink', 0)), { solid: SOLID });
  s.add('pass', new Pixels(20, 20, c('ink', 0)));
  s.add('giftThanks', new Pixels(20, 20, c('ink', 0)), { effect: CTR.thanks, eamt: 1, score: 500 });
  // the library
  s.add('board', boards(1));
  s.add('board2', boards(2));
  s.add('rug', rug());
  s.add('panel', panel(), { solid: SOLID });
  s.add('window', window(), { solid: SOLID });
  s.add('shelf', shelf(3), { solid: SOLID });
  s.add('shelf2', shelf(7), { solid: SOLID });
  s.add('desk', desk(), { solid: SOLID });
  s.add('lamp', lamp(), { solid: SOLID });
  s.add('bench', bench(4), { solid: SOLID });
  s.add('bench2', bench(9), { solid: SOLID });
  s.add('stool', stool());
  s.add('storybook', storybook());
  // the little red door (Joe goes out of it from his workbench)
  s.add('doorShut', door(), { solid: SOLID });
  // the Long Road
  s.add('grass', g);
  s.add('grass2', grass(2));
  s.add('flowers', grass(3, true));
  s.add('path', path(1));
  s.add('path2', path(2));
  s.add('tree', tree(4), { solid: SOLID });
  s.add('tree2', tree(6), { solid: SOLID });
  s.add('fence', fence(), { solid: SOLID });
  s.add('signClock', sign('CLOCK', g), { solid: SOLID });
  s.add('signPark', sign('PARK', g), { solid: SOLID });
  s.add('signBand', sign('BAND', g), { solid: SOLID });
  s.add('signOn', sign('ON >', g), { solid: SOLID });
  s.add('barrier', barrier(path(1)), { solid: SOLID });
  // the leg gate: it takes the thank-yous it asks for, and its open half gives them back
  s.add('gateOpen', gate(true, path(1)), { effect: CTR.thanks, eamt: LEG1_THANKS, touch: 'path' });
  s.add('gate', gate(false, path(1)), { solid: SOLID, effect: CTR.thanks, eamt: -LEG1_THANKS, touch: 'gateOpen' });
  for (const k of [0, 1, 2, 3] as const) s.add(`dogHouse${k}`, dogHouse(k, g), { solid: SOLID });
  // the town square
  s.add('cobble', cb);
  s.add('cobble2', cobble(2));
  s.add('towerWall', towerWall(), { solid: SOLID });
  s.add('clock659', clockFace(6, 59), { solid: SOLID });
  s.add('clock700', clockFace(7, 0), { solid: SOLID });
  s.add('towerDoor', towerDoor());
  s.add('lampPost', lampPost(cb), { solid: SOLID });
  s.add('parkBench', parkBench(cb), { solid: SOLID });
  s.add('float0', float(0, cb), { solid: SOLID });
  s.add('float1', float(1, cb), { solid: SOLID });
  s.add('hedge', hedge(1), { solid: SOLID });
  // the friends: walk onto them to talk
  s.add('leo', on(cb, leo()));
  s.add('leoGlad', on(cb, leo(true, true)));
  s.add('reggie', on(cb, reggie(0)), { solid: SOLID });
  // the Clown Club, waving in turn (two look-alike pairs on their own clocks)
  s.add('clownA1', on(cb, clown('blue', 'red', 1)), { solid: SOLID, next: 'clownA0', ntime: 9 });
  s.add('clownA0', on(cb, clown('blue', 'red', 0)), { solid: SOLID, next: 'clownA1', ntime: 23 });
  s.add('clownB0', on(cb, clown('green', 'yellow', 0)), { solid: SOLID, next: 'clownB1', ntime: 31 });
  s.add('clownB1', on(cb, clown('green', 'yellow', 1)), { solid: SOLID, next: 'clownB0', ntime: 8 });
  // Doc Leo's corner at seven: the rope lets Joe in once (chapter 1's flag), the swing gate only out
  addRope(s, cb, 1);
  s.add('swing', swingGate(cb), { solid: ONE_WAY_SOUTH });
  addKeepsakes(s, cb, 'cobble');
  return s;
}
