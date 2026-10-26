// park.bbl: the top-down blocks of chapter 2's park (the lawn, Gwinn's fenced yard, Teddy's
// valentine party under an arch of paper hearts) and chapter 3's Main Street (sidewalks, the
// parade route's lanes and the hidden spots the parade comes out of, the bandstand, and the
// drumsticks dropped along the way).
import { Pixels, rng } from '../../../kit/pixels';
import { bevel } from '../art/draw';
import { c, r } from '../art/pal';
import { CTR, DRUMSTICKS, VALENTINES } from '../ids';
import { FLOAT_LANES } from '../sprites/critters';
import { bard, teddy } from '../sprites/friends';
import { addKeepsakes, heart } from './keepsakes';
import { BlockSet, SOLID } from './sets';
import { ONE_WAY_SOUTH, addRope, fence, grass, hedge, lampPost, noise, on, parkBench, path, swingGate, tree } from './tiles';

/** The picnic blanket: red and white checks. */
function blanket(): Pixels {
  const p = new Pixels(20, 20);
  return p.map((x, y) => ((Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? c('red', 2) : c('paper', 4)));
}

function table(): Pixels {
  const p = blanket();
  bevel(p, 1, 3, 18, 14, r('wood'), 4);
  // a cake with a heart on it, and cups
  p.disc(8, 10, 4, c('paper', 4)).ring(8, 10, 4, c('pink', 1));
  heart(p, 8, 10, 2, c('red', 3));
  p.rect(14, 6, 2, 3, c('blue', 3)).rect(14, 12, 2, 3, c('green', 3));
  return p;
}

/** A garden arch for the party: bare (it wants twelve valentines) or hung with them. */
function arch(full: boolean, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(1, 2, 3, 18, c('paper', 3)).rect(16, 2, 3, 18, c('paper', 3));
  p.rect(1, 1, 18, 3, c('paper', 3));
  p.frame(1, 1, 18, 19, c('stone', 2));
  if (!full) {
    // the gap is roped with ribbon, and a little card hangs in it: one empty heart
    p.rect(4, 4, 12, 1, c('pink', 2));
    p.rect(6, 9, 8, 6, c('paper', 4)).frame(6, 9, 8, 6, c('ink', 1));
    p.line(8, 5, 7, 9, c('ink', 1)).line(12, 5, 13, 9, c('ink', 1));
    heart(p, 10, 12, 2, c('pink', 1));
    return p;
  }
  for (const [x, y, col] of [
    [2, 4, 'red'],
    [17, 7, 'pink'],
    [2, 11, 'pink'],
    [17, 14, 'red'],
    [6, 2, 'red'],
    [13, 2, 'pink'],
    [2, 17, 'red'],
    [17, 18, 'pink'],
  ] as const)
    heart(p, x, y, 2, c(col, 3));
  return p;
}

function balloons(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.line(10, 19, 5, 9, c('ink', 1)).line(10, 19, 10, 8, c('ink', 1)).line(10, 19, 15, 9, c('ink', 1));
  heart(p, 5, 6, 4, c('red', 3));
  p.disc(10, 5, 4, c('pink', 2));
  heart(p, 15, 6, 4, c('purple', 3));
  p.set(4, 4, c('paper', 4)).set(9, 3, c('paper', 4)).set(14, 4, c('paper', 4));
  return p;
}

// ------------------------------------------------------------------ Main Street

function paver(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 3));
  for (let y = 0; y < 20; y += 10) for (let x = (y / 10) % 2 ? -5 : 0; x < 20; x += 10) p.frame(x, y, 10, 10, c('stone', 2));
  return noise(p, seed, 'stone', 3, 4, 0.15);
}

/** The road: asphalt, with a dashed line along the middle of a lane if `dash`. */
function asphalt(seed: number, dash = false): Pixels {
  const p = noise(new Pixels(20, 20, c('ink', 1)), seed, 'stone', 0, 1, 0.3);
  if (dash) p.rect(2, 9, 8, 2, c('yellow', 2));
  return p;
}

/** A storefront seen from above: its roof, an awning along the bottom edge in stripes. */
function shop(seed: number): Pixels {
  const R = rng(seed);
  const roof = ['brick', 'stone', 'wood'][Math.floor(R() * 3)];
  const p = noise(new Pixels(20, 20, c(roof, 2)), seed, roof, 1, 3, 0.3);
  const awning = ['red', 'blue', 'green', 'purple'][seed % 4];
  for (let x = 0; x < 20; x++) p.rect(x, 14, 1, 6, Math.floor(x / 3) % 2 ? c(awning, 3) : c('paper', 4));
  p.rect(0, 19, 20, 1, c('ink', 1));
  if (R() < 0.5) p.rect(4, 3, 4, 4, c('stone', 1)).frame(4, 3, 4, 4, c('ink', 1));
  return p;
}

/** A drumstick someone dropped, lying on the sidewalk. */
function droppedStick(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  for (let x = 5; x < 17; x++) p.set(x, 14, c('ink', 1));
  p.line(4, 13, 15, 7, c('wood', 4)).line(4, 12, 15, 6, c('wood', 3));
  p.disc(16, 6, 2, c('paper', 4));
  return p;
}

/** The bandstand's bass drum, on its side in front of the Bard's corner: it waits for its sticks. */
function bassDrum(open: boolean, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  if (open) {
    // rolled aside, the sticks crossed on top
    p.disc(4, 10, 3.5, c('red', 2)).disc(4, 10, 2.2, c('paper', 4));
    p.line(1, 6, 8, 13, c('wood', 4)).line(1, 13, 8, 6, c('wood', 4));
    return p;
  }
  p.rect(2, 4, 16, 12, c('red', 2)).frame(2, 4, 16, 12, c('ink', 0));
  for (let x = 3; x < 18; x += 3) p.line(x, 5, x + 1, 14, c('paper', 3));
  p.disc(10, 10, 4.5, c('paper', 4)).ring(10, 10, 4.5, c('brass', 3));
  heart(p, 10, 10, 2, c('red', 3));
  return p;
}

/** The bandstand roof, a quarter in each of four blocks: a white octagon with a red top. */
function bandstand(part: number, ground: Pixels): Pixels {
  const big = new Pixels(40, 40);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) big.set(x, y, ground.get(x % 20, y % 20));
  big.disc(20, 20, 18, c('paper', 4)).disc(20, 20, 18.5 - 1.5, c('paper', 3));
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    big.line(20, 20, 20 + Math.cos(a) * 17, 20 + Math.sin(a) * 17, c('red', 2));
  }
  big.disc(20, 20, 5, c('red', 3)).disc(20, 20, 2, c('brass', 3));
  return big.crop((part % 2) * 20, part < 2 ? 0 : 20, 20, 20);
}

function bunting(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.line(0, 3, 19, 3, c('ink', 1));
  for (let x = 0; x < 20; x += 5) {
    const col = c(['red', 'yellow', 'blue', 'green'][x / 5], 3);
    for (let k = 0; k < 4; k++) p.rect(x + k / 2, 4 + k, 4 - k, 1, col);
  }
  return p;
}

export function parkSet(): BlockSet {
  const s = new BlockSet(150, false);
  const g = grass(11);
  const pv = paver(1);
  // the park
  s.add('grass', g);
  s.add('grass2', grass(12));
  s.add('flowers', grass(13, true));
  s.add('path', path(5));
  s.add('hedge', hedge(4), { solid: SOLID });
  s.add('tree', tree(7), { solid: SOLID });
  s.add('fence', fence(), { solid: SOLID });
  s.add('blanket', blanket());
  s.add('table', table(), { solid: SOLID });
  s.add('balloons', balloons(g), { solid: SOLID });
  s.add('teddy', on(g, teddy()));
  s.add('teddyGlad', on(blanket(), teddy(true)));
  // the party arch: it takes the twelve valentines, and stands open hung with them
  s.add('archFull', arch(true, g));
  s.add('arch', arch(false, g), { solid: SOLID, effect: CTR.task, eamt: -VALENTINES, touch: 'archFull' });
  addRope(s, g, 2);
  s.add('swing2', swingGate(g), { solid: ONE_WAY_SOUTH });
  // Main Street
  s.add('paver', pv);
  s.add('paver2', paver(2));
  s.add('road', asphalt(1));
  s.add('lane', asphalt(2, true));
  // where the parade comes out from behind the shops, each lane on its own clock
  FLOAT_LANES.forEach((lane, k) => s.add(`spawn${k}`, asphalt(3 + k, k % 2 === 1), { birthMon: lane.mon, birthTime: lane.every }));
  for (let k = 0; k < 4; k++) s.add(`shop${k}`, shop(k + 3), { solid: SOLID });
  s.add('lampPost', lampPost(pv), { solid: SOLID });
  s.add('bench', parkBench(pv), { solid: SOLID });
  s.add('bunting', bunting(pv), { solid: SOLID });
  for (let k = 0; k < 4; k++) s.add(`bandstand${k}`, bandstand(k, pv), { solid: SOLID });
  s.add('stick', droppedStick(pv), { effect: CTR.task, eamt: 1, score: 25, touch: 'paver' });
  s.add('drumOpen', bassDrum(true, pv));
  s.add('drum', bassDrum(false, pv), { solid: SOLID, effect: CTR.task, eamt: -DRUMSTICKS, touch: 'drumOpen' });
  s.add('bard', on(pv, bard(0)));
  s.add('bardGlad', on(pv, bard(1)));
  addRope(s, pv, 3);
  s.add('swing3', swingGate(pv), { solid: ONE_WAY_SOUTH });
  addKeepsakes(s, pv, 'paver', { valentine: 'blanket' });
  return s;
}
