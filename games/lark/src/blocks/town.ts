// town.bbl: the top-down blocks of the library, the Long Road and the town square, seen from
// above as Joe walks them a block a step. Floors and grass, walls and shelves, the friends who
// talk (walk onto them), the gates that count, and the cells of the pass map the talks use.
import { SOLBOT, SOLLEF, SOLRIG } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, over, shadeAt } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR, LEG1_THANKS } from '../ids';
import { clown, leo, reggie } from '../sprites/people';
import { addKeepsakes } from './keepsakes';
import { BlockSet, SOLID } from './sets';

const O = () => c('ink', 0);

function noise(p: Pixels, seed: number, ramp: string, lo: number, hi: number, amount = 0.5): Pixels {
  const R = rng(seed);
  return p.map((x, y, v) => (R() < amount ? shadeAt(r(ramp), lo, hi, R(), x, y) : v));
}

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

function grass(seed: number, flowers = false): Pixels {
  const p = noise(new Pixels(20, 20, c('grass', 2)), seed, 'grass', 1, 3, 0.45);
  const R = rng(seed + 9);
  for (let i = 0; i < 6; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('grass', 4));
  if (flowers)
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(R() * 16);
      const y = 2 + Math.floor(R() * 16);
      const col = [c('pink', 2), c('yellow', 3), c('paper', 4), c('purple', 3)][i];
      p.set(x, y, col)
        .set(x - 1, y, col)
        .set(x + 1, y, col)
        .set(x, y - 1, col)
        .set(x, y + 1, col)
        .set(x, y, c('yellow', 2));
    }
  return p;
}

function path(seed: number): Pixels {
  const p = noise(new Pixels(20, 20, c('wood', 4)), seed, 'wood', 3, 5, 0.4);
  const R = rng(seed + 3);
  for (let i = 0; i < 5; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('stone', 3));
  return p;
}

function cobble(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 1));
  const R = rng(seed);
  for (let y = 0; y < 20; y += 5)
    for (let x = (y / 5) % 2 ? -3 : 0; x < 20; x += 6) {
      const s = 2 + Math.floor(R() * 2);
      p.rect(x + 1, y + 1, 4, 3, c('stone', s));
      p.rect(x + 1, y + 1, 4, 1, c('stone', s + 1));
    }
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

function door(open: boolean): Pixels {
  const p = panel();
  if (open) {
    p.rect(4, 0, 12, 20, c('dusk', 1));
    p.rect(4, 0, 2, 20, c('red', 2));
    p.rect(5, 16, 10, 4, c('grass', 1));
  } else {
    p.rect(4, 1, 12, 19, c('red', 2)).frame(4, 1, 12, 19, c('red', 0));
    p.rect(6, 3, 8, 6, c('red', 3)).rect(6, 11, 8, 6, c('red', 3));
    // a paw-print knob
    p.disc(13, 12, 1.2, c('brass', 3));
  }
  return p;
}

// ------------------------------------------------------------------ the road

function tree(seed: number): Pixels {
  const p = grass(seed);
  p.disc(11, 12, 8, c('ink', 1));
  const R = rng(seed);
  p.map((x, y, v) => ((x - 10) ** 2 + (y - 10) ** 2 <= 72 ? shadeAt(r('green'), 0, 3, 0.35 + 0.5 * R() - (x + y - 20) / 40, x, y) : v));
  p.disc(7, 7, 2, c('green', 3));
  return p;
}

function fence(): Pixels {
  const p = grass(5);
  p.rect(0, 8, 20, 2, c('wood', 4)).rect(0, 13, 20, 2, c('wood', 4));
  for (const x of [3, 15]) p.rect(x, 5, 3, 12, c('wood', 3)).frame(x, 5, 3, 12, c('wood', 1));
  return p;
}

/** A signpost with a short word painted on its board, standing in grass. */
function sign(word: string, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(9, 10, 2, 9, c('wood', 2));
  p.rect(1, 2, 18, 9, c('wood', 4)).frame(1, 2, 18, 9, c('wood', 1));
  tiny(p, 10 - Math.floor((word.length * 4 - 1) / 2), 4, word, c('ink', 0));
  return p;
}

/** A 3x5 lettering for signs (A-Z, a space, an arrow). */
function tiny(p: Pixels, x: number, y: number, s: string, col: number): void {
  const G: Record<string, string> = {
    A: '010101111101101',
    B: '110101110101110',
    C: '011100100100011',
    D: '110101101101110',
    E: '111100110100111',
    F: '111100110100100',
    G: '011100101101011',
    H: '101101111101101',
    I: '111010010010111',
    K: '101101110101101',
    L: '100100100100111',
    M: '101111111101101',
    N: '110101101101101',
    O: '010101101101010',
    P: '110101110100100',
    R: '110101110101101',
    S: '011100010001110',
    T: '111010010010010',
    U: '101101101101111',
    W: '101101111111101',
    Y: '101101010010010',
    ' ': '000000000000000',
    '>': '100010001010100',
  };
  let cx = x;
  for (const ch of s) {
    const g = G[ch] ?? G[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') p.set(cx + (i % 3), y + Math.floor(i / 3), col);
    cx += 4;
  }
}

/** A sawhorse across the way: striped red and white, with a little hand-lettered card. */
function barrier(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(1, 6, 18, 4, c('paper', 4)).frame(1, 6, 18, 4, O());
  for (let x = 2; x < 18; x += 4) p.rect(x, 7, 2, 2, c('red', 2));
  p.rect(3, 10, 2, 7, c('wood', 2)).rect(15, 10, 2, 7, c('wood', 2));
  p.rect(7, 11, 6, 5, c('paper', 3)).rect(8, 12, 4, 1, c('ink', 1)).rect(8, 14, 3, 1, c('ink', 1));
  return p;
}

/** A field gate on the road: shut it is solid and counts thank-yous; open it stands aside. */
function gate(open: boolean, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(0, 2, 2, 17, c('wood', 2)).rect(18, 2, 2, 17, c('wood', 2));
  if (open) {
    p.rect(2, 2, 3, 15, c('wood', 4)).frame(2, 2, 3, 15, c('wood', 1));
    return p;
  }
  for (const y of [4, 9, 14]) p.rect(2, y, 16, 2, c('wood', 4));
  p.line(2, 15, 17, 4, c('wood', 3));
  // a heart-shaped latch plate in gold: it opens for a thank-you
  p.rect(8, 8, 2, 2, c('gold', 3)).rect(11, 8, 2, 2, c('gold', 3)).rect(8, 9, 5, 2, c('gold', 3)).rect(9, 11, 3, 1, c('gold', 2)).set(10, 12, c('gold', 2));
  return p;
}

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

function lampPost(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(10, 10, 7, c('window', 0));
  p.disc(10, 10, 4, c('window', 1));
  p.disc(10, 10, 2.5, c('window', 2)).disc(10, 10, 1.2, c('yellow', 3));
  p.ring(10, 10, 3, c('ink', 0));
  return p;
}

function parkBench(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(1, 5, 18, 3, c('wood', 4)).rect(1, 9, 18, 3, c('wood', 4)).rect(1, 13, 18, 2, c('wood', 3));
  p.rect(2, 4, 1, 12, c('ink', 1)).rect(17, 4, 1, 12, c('ink', 1));
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

/** A red velvet rope between two brass posts: the way to Doc Leo, once. */
function rope(down: boolean, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(3, 10, 2.5, c('brass', 3)).disc(16, 10, 2.5, c('brass', 3));
  if (down) p.rect(3, 13, 2, 6, c('red', 2));
  else
    for (let x = 4; x < 16; x++)
      p.set(x, 10 + Math.round(Math.sin(((x - 4) / 12) * Math.PI) * 3), c('red', 2)).set(
        x,
        11 + Math.round(Math.sin(((x - 4) / 12) * Math.PI) * 3),
        c('red', 1),
      );
  return p;
}

/** A little swing gate in a hedge that only opens outward (south). */
function swingGate(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(0, 0, 3, 20, c('green', 1)).rect(17, 0, 3, 20, c('green', 1));
  p.rect(3, 8, 14, 3, c('paper', 3)).frame(3, 8, 14, 3, O());
  // an arrow pointing out
  p.rect(9, 12, 2, 5, c('ink', 1)).rect(7, 15, 6, 1, c('ink', 1)).rect(8, 16, 4, 1, c('ink', 1));
  return p;
}

function hedge(seed: number): Pixels {
  return noise(new Pixels(20, 20, c('green', 1)), seed, 'green', 0, 2, 0.6);
}

function on(ground: Pixels, who: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  return over(p, who);
}

// ------------------------------------------------------------------ the set

export function townSet(): BlockSet {
  const s = new BlockSet(150, false);
  const g = grass(1);
  const cb = cobble(1);
  // the pass map's cells first (all black under a black palette; what they give is the point)
  s.add('void', new Pixels(20, 20, c('ink', 0)), { solid: SOLID });
  s.add('pass', new Pixels(20, 20, c('ink', 0)));
  s.add('giftReady', new Pixels(20, 20, c('ink', 0)), { effect: CTR.ready, eamt: 1 });
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
  // the little red door: shut, it asks that Joe has been to his workbench (and spends it)
  s.add('doorOpen', door(true));
  s.add('doorShut', door(false), { solid: SOLID, effect: CTR.ready, eamt: -1, touch: 'doorOpen' });
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
  s.add('ropeDown', rope(true, cb));
  s.add('rope', rope(false, cb), { solid: SOLID, effect: CTR.flag1, eamt: -1, touch: 'ropeDown' });
  s.add('swing', swingGate(cb), { solid: SOLBOT | SOLLEF | SOLRIG });
  addKeepsakes(s, cb, 'cobble');
  return s;
}
