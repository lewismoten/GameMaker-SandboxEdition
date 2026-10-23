// Level 3's background blocks, Puddlewick Park: far-off trees, the squirrel tree, the
// sandbox (sand to dig through and a tunnel under it), the fountain, whose jet is a gravity
// block that lifts whoever stands in it over the tall hedge, the duck pond (water with
// upward gravity, so Teddy paddles at the surface), the covered bridge, and the lawn with
// its bench, lamppost, picnic tables and mud puddle.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, micro, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { kid } from '../sprites/folks';
import { sign } from './level1Tiles';
import { branch, buried, c, cloud, copy, dirt, grassTop, hedge, leaves, r, sky, trunk, tuft } from '../blocks/tiles';

export const G = 40;

/** Water: `deep` below the surface; `phase` for the ripple animation. */
function water(surface: boolean, phase: number, base?: Pixels): Pixels {
  const p = base ? copy(base) : new Pixels(20, 20, c('water', 1));
  if (!base) for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x * 3 + y * 7 + phase * 5) % 13 === 0) p.set(x, y, c('water', 2));
  if (surface) {
    p.rect(0, 12, 20, 8, c('water', 1));
    for (let x = 0; x < 20; x++) {
      const y = 11 + Math.round(Math.sin((x + phase * 4) / 3));
      p.set(x, y, c('water', 3)).set(x, y + 1, c('water', 2));
    }
  }
  return p;
}

export function parkTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let k = 0; k < 2; k++) for (let part = 0; part < 3; part++) t.air(`cloud${k}${part}`, cloud(k, part, k * 7 + 3));
  t.wall('grass', grassTop(41));
  t.wall('grass2', grassTop(42));
  t.wall('dirt', dirt(43));
  t.wall('deep', dirt(44, true));
  t.wall('dirtRock', buried('rock', 61));
  t.wall('dirtRoots', buried('roots', 62));
  t.wall('dirtWorm', buried('worm', 63));
  // a line of trees far off behind the lawn
  const far = (top: boolean, seed: number) => {
    const p = top ? sky(3) : new Pixels(20, 20, c('leaf', 2));
    const R = rng(seed);
    for (let i = 0; i < 6; i++) blob(p, R() * 20, (top ? 13 : 5) + R() * 8, 5 + R() * 3, 5, [c('leaf', 1), c('leaf', 2), c('leaf', 3)], 0, 2, 0.6);
    return p;
  };
  t.air('farTop', far(true, 51));
  t.air('far', far(false, 52));
  t.air('lawn', tuft(new Pixels(20, 20, c('grass', 3)), 53));
  t.air('lawnFlower', tuft(new Pixels(20, 20, c('grass', 3)), 54, 'yellow'));
  t.air('lawnFlower2', tuft(new Pixels(20, 20, c('grass', 3)), 55, 'pink'));
  t.wall('hedgeWall', hedge(false, 56));
  t.wall('hedgeTopWall', hedge(true, 57, sky(0)));
  t.wall('hedgeTopWall1', hedge(true, 57, sky(1)));

  // The squirrel tree.
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(90 + k, sky(k)));
  t.air('trunk', trunk(t.pic('farTop')));
  t.air('trunkLawn', trunk(t.pic('lawn')));
  t.air('trunkTop', trunk(leaves(95, sky(2))));
  for (let k = 1; k < 4; k++) t.ledge(`branch${k}`, branch(leaves(96 + k, sky(k))));

  // The sandbox: a wooden frame, sand to dig through, a tunnel under it.
  const sand = (seed: number) => speckle(new Pixels(20, 20), 0, 0, 20, 20, r('yellow'), 2, 1, seed, 0.3);
  t.wall(
    'sand',
    (() => {
      const p = sand(60);
      p.rect(0, 0, 20, 2, c('yellow', 3));
      return p;
    })(),
  );
  t.wall(
    'sandFrame',
    (() => {
      const p = sand(61);
      p.rect(0, 0, 20, 6, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 5, 20, 1, c('wood', 1));
      return p;
    })(),
  );
  t.air(
    'sandHole',
    (() => {
      const p = new Pixels(20, 20, c('yellow', 0));
      for (let i = 0; i < 30; i++) p.set((i * 7) % 20, (i * 13) % 20, c('yellow', 1));
      return p;
    })(),
  );
  t.air(
    'bucket',
    (() => {
      const p = copy(t.pic('lawn'));
      p.rect(5, 10, 10, 10, c('red', 2)).rect(4, 9, 12, 2, c('red', 3)).line(5, 9, 10, 3, c('metal', 2)).line(10, 3, 14, 9, c('metal', 2));
      return p;
    })(),
  );

  // The fountain: a stone basin and a jet that lifts whoever stands in it.
  t.wall(
    'rim',
    (() => {
      const p = copy(t.pic('lawn'));
      p.rect(0, 8, 20, 12, c('stone', 3)).rect(0, 8, 20, 2, c('stone', 4)).rect(0, 14, 20, 1, c('stone', 1));
      return p;
    })(),
  );
  for (const ph of [0, 1]) {
    const jet = (base: Pixels, top: boolean) => {
      const p = copy(base);
      for (let y = top ? 8 : 0; y < 20; y++)
        for (let x = 4; x < 16; x++) if ((x + y * 3 + ph * 7) % 5 !== 0) p.set(x, y, (x + y + ph) % 4 ? c('water', 3) : c('cloud', 2));
      if (top) {
        blob(p, 6 + ph * 2, 8, 4, 3, [c('water', 3), c('cloud', 2)], 0, 1);
        blob(p, 14 - ph * 2, 7, 4, 3, [c('water', 3), c('cloud', 2)], 0, 1);
      }
      return p;
    };
    for (let k = 1; k < 4; k++) {
      t.air(`jet${k}_${ph}`, jet(sky(k), false), { grav: GRAV.up, next: `jet${k}_${1 - ph}`, ntime: 3 });
      t.air(`jetTop${k}_${ph}`, jet(sky(k), true), { grav: GRAV.up, next: `jetTop${k}_${1 - ph}`, ntime: 3 });
    }
    t.air(`jetFar_${ph}`, jet(t.pic('far'), false), { grav: GRAV.up, next: `jetFar_${1 - ph}`, ntime: 3 });
    t.air(`jetFarTop_${ph}`, jet(t.pic('farTop'), false), { grav: GRAV.up, next: `jetFarTop_${1 - ph}`, ntime: 3 });
    t.air(`jetLawn_${ph}`, jet(t.pic('lawn'), false), { grav: GRAV.up, next: `jetLawn_${1 - ph}`, ntime: 3 });
  }

  // The duck pond: water that floats Teddy up to the surface (doggy paddle!).
  for (const ph of [0, 1]) {
    t.air(`surface_${ph}`, water(true, ph, sky(3)), { next: `surface_${1 - ph}`, ntime: 9 });
    t.air(`pond_${ph}`, water(false, ph), { grav: GRAV.up, next: `pond_${1 - ph}`, ntime: 9 });
  }
  t.wall(
    'pondBed',
    (() => {
      const p = dirt(70, true);
      p.rect(0, 0, 20, 4, c('stone', 1));
      return p;
    })(),
  );
  t.wall(
    'bank',
    (() => {
      const p = new Pixels(20, 20, c('stone', 2));
      for (let i = 0; i < 6; i++) blob(p, (i * 7) % 20, (i * 11) % 20, 5, 4, r('stone'), 1, 3, 0.7);
      return p;
    })(),
  );
  t.wall(
    'rock',
    (() => {
      const p = water(true, 0, sky(3));
      blob(p, 10, 13, 10, 8, r('stone'), 0, 4);
      return p;
    })(),
  );
  t.wall(
    'bankTop',
    (() => {
      const p = copy(t.pic('bank'));
      p.rect(0, 0, 20, 4, c('grass', 3)).rect(0, 4, 20, 1, c('grass', 1));
      return p;
    })(),
  );

  // The covered bridge: stairs, a plank floor, posts and a shingled roof.
  t.wall(
    'stair',
    (() => {
      const p = new Pixels(20, 20, c('wood', 2));
      p.rect(0, 0, 20, 3, c('wood', 4)).rect(0, 3, 20, 1, c('wood', 0));
      for (let y = 8; y < 20; y += 6) p.rect(0, y, 20, 1, c('wood', 1));
      return p;
    })(),
  );
  t.ledge(
    'bridge',
    (() => {
      const p = water(true, 0, sky(2));
      p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
      p.rect(3, 5, 3, 15, c('wood', 1)).rect(14, 5, 3, 15, c('wood', 1));
      return p;
    })(),
  );
  t.air(
    'bridgeInside',
    (() => {
      const p = copy(sky(2));
      p.rect(0, 0, 20, 2, c('wood', 1));
      p.rect(0, 10, 20, 2, c('red', 2));
      p.rect(9, 0, 2, 20, c('red', 1));
      return p;
    })(),
  );
  t.wall(
    'bridgeRoof',
    (() => {
      const p = copy(sky(2));
      for (let y = 6; y < 20; y++) p.rect(0, y, 20, 1, (y >> 1) % 3 ? c('roof', 2) : c('roof', 1));
      p.rect(0, 17, 20, 3, c('wood', 1));
      return p;
    })(),
  );

  // The lawn: kids on a bench, a lamppost, picnic tables, a mud puddle.
  t.wall(
    'bench',
    (() => {
      const p = copy(t.pic('lawn'));
      p.rect(0, 6, 20, 3, c('wood', 3)).rect(0, 6, 20, 1, c('wood', 4)).rect(2, 9, 2, 11, c('metal', 1)).rect(16, 9, 2, 11, c('metal', 1));
      return p;
    })(),
  );
  t.on('kidBench', kid('boy'), 'far');
  t.on('kidBench2', kid('girl'), 'far');
  t.air(
    'lamp',
    (() => {
      const p = copy(t.pic('lawn'));
      p.rect(9, 0, 2, 20, c('ink', 1));
      return p;
    })(),
  );
  t.air(
    'lampTop',
    (() => {
      const p = copy(t.pic('far'));
      p.rect(9, 8, 2, 12, c('ink', 1));
      blob(p, 10, 5, 4, 4, r('glow'), 1, 3);
      p.rect(7, 1, 6, 1, c('ink', 1));
      return p;
    })(),
  );
  t.wall(
    'picnic',
    (() => {
      const p = copy(t.pic('lawn'));
      p.rect(0, 4, 20, 3, c('wood', 3)).rect(0, 4, 20, 1, c('wood', 4));
      for (let x = 0; x < 20; x += 4) p.rect(x, 4, 2, 3, c('red', 2));
      p.line(3, 7, 7, 19, c('wood', 1)).line(16, 7, 12, 19, c('wood', 1));
      return p;
    })(),
  );
  t.air(
    'basket',
    (() => {
      const p = copy(t.pic('lawn'));
      p.rect(3, 10, 12, 10, c('wood', 3));
      for (let y = 10; y < 20; y += 3) p.rect(3, y, 12, 1, c('wood', 1));
      p.rect(14, 15, 6, 5, c('red', 2)).rect(15, 16, 2, 2, c('paint', 3));
      p.rect(0, 17, 4, 3, c('yellow', 3));
      return p;
    })(),
  );
  t.wall(
    'mud',
    (() => {
      const p = grassTop(71);
      blob(p, 10, 2, 11, 4, r('gwinn'), 0, 2);
      return p;
    })(),
  );
  t.on('discKid', kid('girl'), 'lawn', 'air', { birthMon: 0, birthTime: 0 });
  t.air('parkSign', sign(t.pic('lawn'), 'PARK'));
  t.wall(
    'gatePost',
    (() => {
      const p = new Pixels(20, 20, c('brick', 2));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('stone', 3));
      p.rect(4, 0, 12, 20, c('brick', 1));
      return p;
    })(),
  );
  t.air(
    'gateTop',
    (() => {
      const p = copy(sky(1));
      p.rect(0, 10, 20, 10, c('brick', 2)).rect(0, 8, 20, 3, c('stone', 3));
      micro(p, 1, 13, 'PARK', c('paint', 3));
      return p;
    })(),
  );
  t.klownCar(
    (_bx, by) => (by === 0 ? t.pic('far') : t.pic('lawn')),
    'shoes',
    t.pic('farTop'),
    (by) => (by === 0 ? t.pic('far') : t.pic('lawn')),
  );
  return t;
}
