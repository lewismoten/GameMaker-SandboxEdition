// Level 4's background blocks, the river: the bank, rapids whose water carries Teddy
// downstream (gravity to the right as well as up), stepping stones, the old mill with its
// waterwheel turning (two pictures taking turns), the miller's grain hoist and its loft,
// the high bank, the calm pool below it, the beach and the charging post by the boat ramp.
import { Pixels } from '../../../kit/pixels';
import { blob, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { bricks, c, canvas, cloud, copy, cut, dirt, grassTop, hedge, leaves, planks, r, sky, trunk, tuft } from '../blocks/tiles';
import { sign, water } from './common';
import { fisher, miller, sack } from '../sprites/river';
import { halves } from '../sprites/people';

export const G = 40;
export const bandRow = (y: number) => (y <= 31 ? 0 : y <= 34 ? 1 : y <= 37 ? 2 : 3);
export const skyAt = (y: number) => `sky${bandRow(y)}`;

export function riverTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(0, part, 9));
  t.wall('grass', grassTop(1));
  t.wall('dirt', dirt(3));
  t.wall('deep', dirt(5, true));
  t.air('tuft', tuft(sky(3), 11));
  t.air('flower', tuft(sky(3), 12, 'yellow'));
  t.air('hedgeTop', hedge(true, 21, sky(bandRow(29))));
  t.wall('hedgeWall', hedge(false, 25));
  // trees: leaves and trunk over each sky band (the map picks by row); likewise the
  // canvases below are drawn over the sky of the rows they stand on
  for (const k of [1, 2]) t.air(`leaf${k}`, leaves(6 + k, sky(k)));
  t.air('trunk', trunk(sky(3)));
  t.air('trunk2', trunk(sky(2)));
  t.air('leaf0', leaves(6, sky(0)));
  t.air('trunk0', trunk(sky(0)));
  t.air('trunk1', trunk(sky(1)));

  // Rapids: white water that carries Teddy along (gravity right), and lifts him (up).
  const foam = (base: Pixels, ph: number) => {
    const p = copy(base);
    for (let i = 0; i < 9; i++) {
      const x = (i * 7 + ph * 5) % 20;
      const y = (i * 5 + ph * 3) % 20;
      p.rect(x, y, 3, 1, c('paint', 3)).set(x + 3, y + 1, c('water', 3));
    }
    return p;
  };
  for (const ph of [0, 1]) {
    t.air(`rapid${ph}`, foam(water(true, ph, sky(3)), ph), { grav: GRAV.right | GRAV.down, next: `rapid${1 - ph}`, ntime: 3 });
    t.air(`rapidDeep${ph}`, foam(water(false, ph), ph + 2), { grav: GRAV.right | GRAV.up, next: `rapidDeep${1 - ph}`, ntime: 3 });
    t.air(`pool${ph}`, water(true, ph, sky(3)), { next: `pool${1 - ph}`, ntime: 9 });
    t.air(`poolDeep${ph}`, water(false, ph), { grav: GRAV.up, next: `poolDeep${1 - ph}`, ntime: 9 });
  }
  t.wall(
    'bed',
    (() => {
      const p = dirt(14, true);
      for (let i = 0; i < 6; i++) blob(p, (i * 7) % 20, 4 + ((i * 5) % 12), 3, 2, r('stone'), 1, 3);
      return p;
    })(),
  );
  // stepping stones, sitting in the rapids
  t.wall(
    'stone',
    (() => {
      const p = water(false, 0);
      blob(p, 10, 9, 10, 10, r('stone'), 0, 4);
      p.rect(0, 15, 20, 5, c('water', 2));
      for (let x = 0; x < 20; x += 3) p.set(x, 15, c('paint', 3));
      return p;
    })(),
  );
  t.wall(
    'sand',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('hay'), 2, 1, 15, 0.25);
      p.rect(0, 0, 20, 2, c('hay', 3));
      return p;
    })(),
  );

  // The waterwheel, turning (2 wide, 3 high, two pictures taking turns).
  for (const ph of [0, 1]) {
    const w = canvas(2, 3, (_bx, by) => (by < 2 ? sky(bandRow(38 + by)) : water(true, ph, sky(3))));
    w.disc(20, 30, 18, c('wood', 1)).disc(20, 30, 14, c('wood', 0));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + ph * (Math.PI / 8);
      const x = 20 + Math.cos(a) * 17;
      const y = 30 + Math.sin(a) * 17;
      w.line(20, 30, Math.round(x), Math.round(y), c('wood', 2));
      w.rect(Math.round(x) - 2, Math.round(y) - 2, 5, 5, c('wood', 3));
    }
    w.disc(20, 30, 3, c('metal', 2));
    const wc = cut(w);
    for (let by = 0; by < 3; by++) for (let bx = 0; bx < 2; bx++) t.air(`wheel${bx}${by}_${ph}`, wc[by][bx], { next: `wheel${bx}${by}_${1 - ph}`, ntime: 4 });
  }

  // The old mill: stone below, boards above, a roof; cut open to show the inside.
  t.air(
    'millIn',
    (() => {
      const p = planks(21, 'wood', 1);
      return p;
    })(),
  );
  t.air('millStone', bricks(22, 'stone', 'ink'));
  t.wall('millWall', bricks(23, 'stone', 'ink'));
  t.wall(
    'millWallHi',
    (() => {
      const p = planks(24, 'wood', 2);
      p.rect(0, 0, 3, 20, c('wood', 0));
      return p;
    })(),
  );
  t.air(
    'millDoor',
    (() => {
      const p = planks(24, 'wood', 2);
      p.rect(3, 2, 14, 18, c('ink', 0)).rect(3, 2, 14, 2, c('wood', 3));
      return p;
    })(),
  );
  const roof = (k: number, side: 'L' | 'M' | 'R') => {
    const p = sky(k);
    for (let y = 0; y < 20; y++) {
      const x0 = side === 'L' ? 19 - y : 0;
      const x1 = side === 'R' ? y + 1 : 20;
      for (let x = Math.max(0, x0); x < Math.min(20, x1); x++) p.set(x, y, (y % 5 === 4 ? c('wood', 0) : c('wood', 2)));
    }
    return p;
  };
  t.air('millRoofL', roof(bandRow(30), 'L'));
  t.air('millRoof', roof(bandRow(30), 'M'));
  t.air('millRoofR', roof(bandRow(30), 'R'));
  t.ledge(
    'loft',
    (() => {
      const p = copy(t.pic('millIn'));
      p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('ink', 0));
      return p;
    })(),
  );
  t.air(
    'shaft',
    (() => {
      const p = copy(t.pic('millIn'));
      p.rect(2, 0, 2, 20, c('metal', 1)).rect(16, 0, 2, 20, c('metal', 1));
      return p;
    })(),
  );
  t.air(
    'millstone',
    (() => {
      const p = copy(t.pic('millIn'));
      blob(p, 10, 14, 9, 5, r('stone'), 1, 3);
      p.rect(9, 10, 2, 2, c('ink', 0));
      return p;
    })(),
  );
  const sk = sack();
  t.on('sack', sk, 'millIn');
  t.air('sackLoft', (() => {
    const p = copy(t.pic('millIn'));
    p.blit(sk, 0, 0, 255);
    p.blit(sk, 6, -6, 255);
    return p;
  })());
  const [mTop, mBot] = halves(miller(), t.pic('millIn'), t.pic('millIn'));
  t.air('millerTop', mTop);
  t.air('millerBot', mBot);

  // The high bank, a fisherman at its edge, the beach.
  t.wall(
    'cliff',
    (() => {
      const p = dirt(31);
      for (let i = 0; i < 4; i++) blob(p, (i * 9) % 20, (i * 7) % 20, 3, 2, r('stone'), 1, 2);
      return p;
    })(),
  );
  t.wall('cliffTop', grassTop(32));
  const [fTop, fBot] = halves(fisher(), sky(bandRow(33)), sky(bandRow(34)));
  t.air('fisherTop', fTop);
  t.air('fisherBot', fBot);
  t.air(
    'line',
    (() => {
      const p = sky(2);
      p.rect(9, 0, 1, 20, c('metal', 2));
      return p;
    })(),
  );
  t.air(
    'lineLow',
    (() => {
      const p = sky(3);
      p.rect(9, 0, 1, 20, c('metal', 2));
      return p;
    })(),
  );
  t.air('signSwim', sign(sky(3), 'NO SWIM'));
  t.air('signMill', sign(sky(3), 'MILL'));
  t.air(
    'picnic',
    (() => {
      const p = sky(3);
      p.rect(0, 8, 20, 3, c('red', 2)).rect(0, 8, 20, 1, c('red', 3));
      for (let x = 0; x < 20; x += 4) p.rect(x, 8, 2, 3, c('paint', 3));
      p.rect(3, 11, 2, 9, c('wood', 1)).rect(15, 11, 2, 9, c('wood', 1));
      return p;
    })(),
  );
  t.air(
    'charger',
    (() => {
      const p = sky(3);
      p.rect(6, 4, 8, 16, c('paint', 3)).frame(6, 4, 8, 16, c('ink', 0)).rect(8, 7, 4, 3, c('green', 2));
      p.line(14, 12, 19, 16, c('ink', 0));
      return p;
    })(),
  );
  return t;
}
