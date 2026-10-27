// snow.bbl: the top-down blocks of the road's third leg and chapter 7, a snow day. Snow over the
// fields and the road, trodden paths, snowy trees and fences; Lewie's street (houses roofed in
// snow, their front walks and doormats, the plowed street and the plow's start, lamp posts and a
// snowman); Teenage Lewie with his shovel, his porch steps (they want every walk cleared) and his
// corner by the window where the hearth glows.
import { Pixels, rng } from '../../../kit/pixels';
import { lewieCameo } from '../../../kit/cameos';
import { bevel, shadeAt } from '../art/draw';
import { PAL, c, r } from '../art/pal';
import { CTR, SHOVEL, WALKS, flag } from '../ids';
import { addKeepsakes } from './keepsakes';
import { BlockSet, SOLID } from './sets';
import { ONE_WAY_SOUTH, addRope, barrier, on, sign, swingGate } from './tiles';

const O = () => c('ink', 0);

/** Fresh snow: soft white, blue in the hollows, a glint or two. */
function snow(seed: number): Pixels {
  const p = new Pixels(20, 20);
  const R = rng(seed);
  p.map((x, y) => shadeAt(r('snow'), 2, 4, 0.75 + 0.25 * Math.sin((x + seed * 3) / 3.1) * Math.cos((y - seed) / 4.3), x, y));
  for (let i = 0; i < 3; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('tin', 6));
  return p;
}

/** A path trodden or shoveled through the snow: gray slush, snow banked at the edges. */
function trodden(seed: number, banks: 'ns' | 'ew' | 'none' = 'none'): Pixels {
  const p = new Pixels(20, 20);
  const R = rng(seed);
  p.map(() => (R() < 0.3 ? c('stone', 2 + Math.floor(R() * 2)) : c('snow', 1)));
  if (banks === 'ns') p.rect(0, 0, 2, 20, c('snow', 3)).rect(18, 0, 2, 20, c('snow', 3));
  if (banks === 'ew') p.rect(0, 0, 20, 2, c('snow', 3)).rect(0, 18, 20, 2, c('snow', 3));
  return p;
}

/** The plowed street: dark asphalt, wet, tire tracks. */
function street(seed: number): Pixels {
  const p = new Pixels(20, 20, c('ink', 1));
  const R = rng(seed);
  p.map((_x, _y, v) => (R() < 0.15 ? c('stone', 1) : v));
  p.rect(0, 5, 20, 2, c('stone', 0)).rect(0, 13, 20, 2, c('stone', 0));
  return p;
}

function snowTree(seed: number): Pixels {
  const p = snow(seed);
  p.disc(11, 12, 8, c('snow', 0));
  const R = rng(seed);
  p.map((x, y, v) => ((x - 10) ** 2 + (y - 10) ** 2 <= 72 ? shadeAt(r('green'), 0, 2, 0.3 + 0.4 * R() - (x + y - 20) / 40, x, y) : v));
  // snow lying on the boughs
  for (let i = 0; i < 7; i++) p.disc(5 + Math.floor(R() * 10), 4 + Math.floor(R() * 10), 1.5, c('snow', 4));
  return p;
}

function snowFence(): Pixels {
  const p = snow(5);
  p.rect(0, 8, 20, 2, c('wood', 3)).rect(0, 13, 20, 2, c('wood', 3));
  p.rect(0, 7, 20, 1, c('snow', 4)).rect(0, 12, 20, 1, c('snow', 4));
  for (const x of [3, 15]) p.rect(x, 5, 3, 12, c('wood', 2)).frame(x, 5, 3, 12, c('wood', 1)).rect(x, 4, 3, 1, c('snow', 4));
  return p;
}

function snowHedge(seed: number): Pixels {
  const p = new Pixels(20, 20, c('green', 1));
  const R = rng(seed);
  p.map((_x, _y, v) => (R() < 0.5 ? c('green', Math.floor(R() * 2)) : v));
  for (let i = 0; i < 9; i++) p.disc(Math.floor(R() * 20), Math.floor(R() * 9), 2, c('snow', 4));
  return p;
}

/** A house from above, three blocks wide: two rows of snowy roof, then the front wall with its door and windows. */
function house(part: number, roof: string, chimney: boolean, ground: Pixels): Pixels {
  const big = new Pixels(60, 60);
  for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++) big.set(x, y, ground.get(x % 20, y % 20));
  // roof: snow, the ridge across the middle, the eaves showing at the edges
  big.rect(1, 1, 58, 39, c(roof, 1));
  big.rect(3, 3, 54, 35, c('snow', 4));
  for (let x = 3; x < 57; x += 6) big.rect(x, 36, 4, 2, c('snow', 2));
  big.rect(3, 19, 54, 2, c('snow', 2));
  if (chimney) {
    big.rect(42, 6, 8, 9, c('brick', 2)).frame(42, 6, 8, 9, O()).rect(42, 6, 8, 2, c('snow', 4));
    // smoke from the hearth
    big.disc(46, 3, 2, c('stone', 4)).disc(49, 1, 1.5, c('stone', 5));
  }
  // the front wall: clapboard, two lit windows and the door
  big.rect(1, 40, 58, 20, c('paper', 2));
  for (let y = 42; y < 60; y += 4) big.rect(1, y, 58, 1, c('paper', 1));
  for (const wx of [6, 42])
    big
      .rect(wx, 44, 12, 10, c('window', 2))
      .frame(wx, 44, 12, 10, c('wood', 1))
      .rect(wx + 5, 44, 2, 10, c('wood', 1));
  big.rect(24, 42, 12, 18, c(roof, 2)).frame(24, 42, 12, 18, O()).disc(33, 52, 1, c('brass', 3));
  return big.crop((part % 3) * 20, Math.floor(part / 3) * 20, 20, 20);
}

/** A doormat at the top of a front walk, buried (it wants the walk cleared to it) or swept. */
function doormat(swept: boolean): Pixels {
  const p = swept ? trodden(31, 'ns') : snow(31);
  if (swept) {
    p.rect(3, 4, 14, 11, c('brick', 2)).frame(3, 4, 14, 11, c('brick', 1));
    p.rect(6, 8, 8, 1, c('paper', 3)).rect(6, 10, 8, 1, c('paper', 3));
  } else p.rect(3, 12, 14, 3, c('brick', 1)).rect(3, 11, 14, 1, c('snow', 4));
  return p;
}

function lampPost(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(10, 10, 6, c('window', 0)).disc(10, 10, 3.5, c('window', 2)).disc(10, 10, 1.5, c('yellow', 3));
  p.ring(10, 10, 4, O());
  p.rect(7, 4, 6, 2, c('snow', 4));
  return p;
}

/** A snowman somebody made: coal eyes, a carrot nose, a red scarf. Scenery. */
function snowman(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(10, 13, 6, c('snow', 2)).disc(10, 12, 5, c('snow', 4));
  p.disc(10, 6, 4, c('snow', 2)).disc(10, 5, 3.5, c('snow', 4));
  p.set(9, 4, O()).set(11, 4, O()).rect(10, 5, 3, 1, c('red', 4));
  p.rect(6, 9, 8, 2, c('red', 2));
  p.line(4, 10, 1, 7, c('wood', 2)).line(16, 10, 19, 7, c('wood', 2));
  return p;
}

/** Lewie's porch steps: under snow the steps want every walk on the street swept first; swept, they open. */
function steps(open: boolean): Pixels {
  const p = trodden(41, 'ns');
  for (let k = 0; k < 3; k++) p.rect(2, 2 + k * 6, 16, 5, c('wood', 3 - (k % 2))).rect(2, 2 + k * 6, 16, 1, c('wood', 4));
  if (!open) {
    p.rect(1, 0, 18, 13, c('snow', 4)).rect(1, 12, 18, 2, c('snow', 2));
    p.disc(6, 6, 3, c('snow', 3)).disc(14, 5, 3, c('snow', 3));
  }
  return p;
}

/** The hearth through the window of Lewie's house: the fire, a stocking, a mug. */
function hearthWindow(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(1, 1, 18, 14, c('wood', 1));
  bevel(p, 2, 2, 16, 12, r('brick'), 2);
  p.rect(5, 7, 10, 7, c('ink', 0));
  p.disc(10, 12, 3, c('red', 3)).disc(10, 11, 2, c('yellow', 3)).set(10, 9, c('window', 2));
  p.rect(14, 3, 3, 4, c('red', 2)).rect(15, 7, 2, 1, c('paper', 4));
  return p;
}

/** A front yard under deep snow, heaped higher than a robot: ridges of drift with blue shadows, the tops of a buried picket fence poking out. */
function bank(seed: number): Pixels {
  const p = snow(seed + 40);
  for (let k = 0; k < 3; k++) {
    const y0 = 3 + k * 6;
    for (let x = 0; x < 20; x++) {
      const y = y0 + Math.round(Math.sin((x + seed * 3 + k * 7) / 3) * 1.5);
      p.set(x, y, c('snow', 0))
        .set(x, y + 1, c('snow', 1))
        .set(x, y - 1, c('tin', 6));
    }
  }
  for (const x of [3, 10, 17])
    p.rect(x, 15, 2, 4, c('paper', 3))
      .set(x, 14, c('paper', 4))
      .set(x + 1, 14, c('paper', 4));
  return p;
}

/** A drift heaped across a walk or a sidewalk: shovel it (walk into it carrying the shovel) and it is gone. */
function drift(ground: Pixels, seed: number): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  const R = rng(seed);
  for (let i = 0; i < 6; i++) p.disc(3 + Math.floor(R() * 14), 6 + Math.floor(R() * 9), 5, c('snow', 2));
  for (let i = 0; i < 6; i++) p.disc(4 + Math.floor(R() * 12), 5 + Math.floor(R() * 8), 4, c('snow', 4));
  p.map((_x, _y, v) => (v === c('snow', 4) && R() < 0.05 ? c('tin', 6) : v));
  for (let x = 2; x < 18; x++) if (p.get(x, 16) === c('snow', 2)) p.set(x, 17, c('snow', 1));
  return p;
}

/** The top of a front walk, under the eaves: the roof's edge just above throws a strip of shade. */
function eave(): Pixels {
  const p = trodden(11, 'ns');
  p.rect(0, 0, 20, 2, c('snow', 0)).rect(0, 2, 20, 1, c('snow', 1));
  return p;
}

/** The frozen pond: blue-gray ice, a crack or two, snow at the edges. Not for walking on. */
function pond(seed: number): Pixels {
  const p = new Pixels(20, 20);
  p.map((x, y) => shadeAt(r('sky'), 1, 3, 0.5 + 0.3 * Math.sin((x - y + seed * 5) / 4), x, y));
  p.line(3, 4 + seed, 12, 9, c('tin', 6)).line(12, 9, 16, 7, c('tin', 5));
  p.rect(0, 0, 20, 1, c('snow', 4));
  return p;
}

/** Lewie's box of snow things by the sidewalk: shut (it opens once) on a red lid. */
function shovelBox(): Pixels {
  const p = trodden(51);
  p.rect(2, 4, 16, 13, c('wood', 2)).frame(2, 4, 16, 13, O());
  bevel(p, 3, 5, 14, 5, r('red'), 2);
  p.rect(9, 10, 2, 2, c('brass', 3));
  p.rect(2, 3, 16, 2, c('snow', 4));
  return p;
}

/** The little gate in Lewie's hedge, open onto the back garden and the road on. */
function backGate(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(0, 0, 20, 3, c('green', 1)).rect(0, 17, 20, 3, c('green', 1));
  p.rect(0, 3, 3, 14, c('wood', 3)).frame(0, 3, 3, 14, c('wood', 1));
  p.rect(9, 8, 6, 1, c('ink', 1)).rect(8, 9, 1, 1, c('ink', 1)).rect(8, 7, 1, 1, c('ink', 1));
  return p;
}

/** Teenage Lewie (Snowbound's own drawing, in this game's colors), his shovel over his shoulder. */
const lewie = (pose: 'down0' | 'side0' = 'down0') => lewieCameo(PAL.pal, pose);

export function snowSet(): BlockSet {
  const s = new BlockSet(150, false);
  const sn = snow(1);
  const tr = trodden(2);
  // the road's third leg, under snow
  s.add('snow', sn);
  s.add('snow2', snow(2));
  s.add('snow3', snow(3));
  s.add('trodden', tr);
  s.add('trodden2', trodden(3));
  s.add('snowTree', snowTree(4), { solid: SOLID });
  s.add('snowTree2', snowTree(6), { solid: SOLID });
  s.add('snowFence', snowFence(), { solid: SOLID });
  s.add('signSnow', sign('SNOW', sn), { solid: SOLID });
  s.add('signHive', sign('HIVE', sn), { solid: SOLID });
  s.add('snowBarrier', barrier(tr), { solid: SOLID });
  // Lewie's street
  s.add('walk', trodden(11, 'ns'));
  s.add('sidewalk', trodden(12, 'ew'));
  s.add('street', street(1));
  s.add('street2', street(2));
  s.add('plowStart', street(3), { birthMon: 0, birthTime: PLOW_EVERY });
  s.add('hedge', snowHedge(1), { solid: SOLID });
  s.add('bank', bank(1), { solid: SOLID });
  s.add('shovelBox', shovelBox(), { solid: SOLID, effect: flag(7), eamt: -1, touch: 'shovel' });
  s.add('lampPost', lampPost(sn), { solid: SOLID });
  s.add('snowman', snowman(sn), { solid: SOLID });
  for (const [h, roof, chim] of [
    ['A', 'blue', false],
    ['B', 'green', false],
    ['C', 'purple', false],
    ['L', 'red', true],
  ] as const)
    for (let k = 0; k < 9; k++) s.add(`house${h}${k}`, house(k, roof, chim, sn), { solid: SOLID });
  // the drifts: one shovel-load each (they spend the shovel's counter; with no shovel they stay)
  s.add('driftWalk', drift(s.pic('walk'), 7), { solid: SOLID, effect: SHOVEL.counter, eamt: -1, score: 10, touch: 'walk' });
  s.add('driftSide', drift(s.pic('sidewalk'), 9), { solid: SOLID, effect: SHOVEL.counter, eamt: -1, score: 10, touch: 'sidewalk' });
  // the tops of the walks, under the eaves: now and then snow slides off the roof (two clocks, out of step)
  s.add('eaveA', eave(), { birthMon: SNOW_MON.snowfall, birthTime: EAVE_EVERY[0] });
  s.add('eaveB', eave(), { birthMon: SNOW_MON.snowfall, birthTime: EAVE_EVERY[1] });
  s.add('pond', pond(1), { solid: SOLID });
  s.add('doormatSwept', doormat(true));
  s.add('doormat', doormat(false), { effect: CTR.task, eamt: 1, score: 100, touch: 'doormatSwept' });
  s.add('stepsOpen', steps(true));
  s.add('steps', steps(false), { solid: SOLID, effect: CTR.task, eamt: -WALKS, touch: 'stepsOpen' });
  s.add('hearth', hearthWindow(sn), { solid: SOLID });
  s.add('lewie', on(tr, lewie('down0')));
  s.add('lewieGlad', on(tr, lewie('down0')));
  addRope(s, tr, 7);
  s.add('swing7', swingGate(tr), { solid: ONE_WAY_SOUTH });
  s.add('backGate', backGate(tr));
  addKeepsakes(s, tr, 'trodden');
  return s;
}

/** How often (ticks) the plow sets off along Lewie's street. */
const PLOW_EVERY = 120;
/** How often (ticks) snow slides off the roofs onto the walks: two clocks. */
const EAVE_EVERY = [70, 94];
/** Lewie's street's monster numbers (snow.mon, sprites/critters.ts snowCritters). */
const SNOW_MON = { plow: 0, plowOk: 1, snowfall: 2, snowfallHit: 3, snowfallOk: 4 } as const;
