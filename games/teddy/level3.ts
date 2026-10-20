// Level 3: Puddlewick Park, in the afternoon. A hill with a squirrel tree, a sandbox to
// dig through, a fountain whose jet lifts Teddy over the tall hedge, kids who give out
// treats (and Doc Leo's shoes) for a good sit, geese guarding the covered bridge over the
// duck pond, frisbees flying, and Gwin rolling in the mud by the picnic tables.
import { Pixels, rng } from '../kit/pixels';
import { blob, micro, speckle } from './draw';
import { CRITTERS } from './critters';
import { FLIP } from './mons';
import { CTR, POWER } from './ids';
import { GRAV, LevelMap, Tiles, newBestiary, type Level } from './level';
import { askBubble, frisbee, kid } from './folks';
import { propSprite } from './klown';
import { bandOf, sign } from './level1';
import { branch, buried, c, cloud, copy, dirt, grassTop, hedge, leaves, r, sky, trunk, tuft } from './tiles';

const G = 40;

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
  t.wall('hedgeTopWall', hedge(true, 57));

  // The squirrel tree.
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(90 + k, sky(k)));
  t.air('trunk', trunk(t.pic('far')));
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
      const p = copy(sky(1));
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
  t.on('kidBench', kid('boy'), 'lawn');
  t.on('kidBench2', kid('girl'), 'lawn');
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
      blob(p, 10, 2, 11, 4, r('gwin'), 0, 2);
      return p;
    })(),
  );
  t.on('frisbeeKid', kid('girl'), 'lawn', 'air', { birthMon: 0, birthTime: 0 });
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
      const p = copy(sky(2));
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

export function parkBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) {
    if (name.startsWith('goose')) b.pic(name, px, name === 'gooseRun' ? {} : { solid: 15 });
    if (name.startsWith('duck') || name.startsWith('squirrel')) b.pic(name, px, name.startsWith('squirrel') ? { hp: -8 } : {});
  }
  const shoes = propSprite('shoes');
  b.pic('askShoes1', askBubble('SIT?', shoes, 0)).pic('askShoes2', askBubble('SIT?', shoes, 1));
  b.pic('askSit1', askBubble('SIT?', undefined, 0)).pic('askSit2', askBubble('SIT?', undefined, 1));
  b.pic('shoes', shoes).pic('shoesGot', shoes, { effect: CTR.props, eamt: 1, score: 100 });
  b.pic('frisbee1', frisbee(0), { hp: -8 }).pic('frisbee2', frisbee(1), { hp: -8 });
  // The geese guarding the covered bridge: barking is the only thing they respect.
  b.add('goose', {
    pics: [
      ['goose1', 20],
      ['goose2', 6],
    ],
    power: POWER.blocker,
    becomes: 'gooseRun',
    upscore: 50,
  });
  b.add('gooseRun', {
    pics: [['gooseRun', 50]],
    power: 0,
    path: [
      [4, -1, 6],
      [9, -8, 6],
    ],
    end: -1,
  });
  b.add('duck', {
    pics: [
      ['duck1', 6],
      ['duck2', 6],
    ],
    power: POWER.friend,
    path: [
      [4, 0, 1, 0],
      [0, 0, 1, FLIP],
    ],
  });
  b.add('squirrel', {
    pics: [
      ['squirrel1', 3],
      ['squirrel2', 3],
    ],
    power: POWER.pest,
    path: [
      [2, 0, 2, 0],
      [0, 0, 2, FLIP],
    ],
    becomes: 'squirrelRun',
    upscore: 25,
  });
  b.add('squirrelRun', {
    pics: [['squirrel1', 50]],
    power: 0,
    path: [
      [3, -1, 7],
      [6, -6, 7],
    ],
    end: -1,
  });
  // Kids asking for a sit: the shoes, or a treat.
  b.add('askShoes', {
    pics: [
      ['askShoes1', 10],
      ['askShoes2', 10],
    ],
    power: POWER.sitAsk,
    becomes: 'shoesFall',
    upscore: 50,
  });
  b.add('shoesFall', { pics: [['shoes', 50]], power: 2, path: [[0, 2, 3]], end: -1, becomes: 'shoesGot' });
  b.add('shoesGot', { pics: [['shoesGot', 50]], power: 2 });
  b.add('askSit', {
    pics: [
      ['askSit1', 10],
      ['askSit2', 10],
    ],
    power: POWER.sitAsk,
    becomes: 'treatFall2',
    upscore: 25,
  });
  b.add('treatFall2', { pics: [['treat1', 2]], power: POWER.pickup, path: [[0, 2, 3]], end: -1, becomes: 'treat' });
  b.add('frisbee', {
    pics: [
      ['frisbee1', 2],
      ['frisbee2', 2],
    ],
    power: POWER.projectile,
    path: [[-12, 0, 6]],
    end: -1,
  });
  b.add('gwinMud', {
    pics: [
      ['gwinRoll', 6],
      ['gwin1', 4],
      ['gwin2', 4],
      ['gwin3', 4],
    ],
    power: 90,
    path: [
      [3, 0, 2, 0],
      [0, 0, 2, FLIP],
    ],
    becomes: 'gwinGone',
  });
  return b;
}

export function park(): Level {
  const bs = parkTiles();
  const beasts = parkBeasts();
  // the frisbee girl throws a frisbee every few seconds
  const fk = bs.def('frisbeeKid');
  fk.birthMon = beasts.id('frisbee');
  fk.birthTime = 54;
  const m = new LevelMap(bs, beasts, 'sky0');
  const R = rng(13);
  const pick = (...names: string[]) => names[Math.floor(R() * names.length)];
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandOf(y)}`);
  for (const [cx, cy] of [
    [8, 27],
    [26, 26],
    [44, 29],
    [61, 26],
    [80, 28],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${Math.min(1, bandOf(cy))}${part}`);
  m.rect(0, 37, 100, 1, 'farTop');
  m.rect(0, 38, 100, 1, 'far');
  m.rect(0, 39, 100, 1, () => pick('lawn', 'lawn', 'lawnFlower', 'lawnFlower2'));
  m.rect(0, G, 100, 1, () => pick('grass', 'grass2'));
  m.rect(0, G + 1, 100, 3, () => pick('dirt', 'dirt', 'dirt', 'dirt', 'dirtRock', 'dirtRoots', 'dirtWorm'));
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');
  // park walls at both ends (the map wraps)
  m.rect(0, 30, 4, 10, 'hedgeWall');
  m.rect(0, 29, 4, 1, 'hedgeTopWall');
  m.rect(88, 30, 12, 10, 'hedgeWall');
  m.rect(88, 29, 12, 1, 'hedgeTopWall');

  // A small hill with the squirrel tree.
  m.rect(8, 39, 6, 1, 'grass');
  m.rect(9, 38, 4, 1, 'grass2');
  for (let y = 30; y < 37; y++) for (let x = 7; x < 15; x++) if (Math.abs(x - 11) + Math.abs(y - 32) < 5) m.set(x, y, `leaf${bandOf(y)}`);
  m.set(11, 34, 'trunkTop').set(11, 35, 'trunkTop').set(11, 36, 'trunkTop').set(11, 37, 'trunk');
  m.rect(9, 35, 2, 1, 'branch2');
  m.rect(12, 33, 2, 1, 'branch1');

  // The sandbox (dig through the soft sand to a treat cache under it).
  m.set(16, G, 'sandFrame').set(22, G, 'sandFrame');
  m.rect(17, G, 5, 1, 'sand');
  m.rect(18, G, 2, 1, 'sandHole');
  m.rect(17, G + 1, 7, 1, 'sandHole');
  m.set(23, G, 'sandHole');
  m.set(21, 39, 'bucket');

  // The fountain beside the tall hedge: its jet lifts Teddy over.
  m.set(25, 39, 'rim');
  for (let y = 31; y < 40; y++)
    for (const x of [26, 27]) {
      const top = y === 31;
      const name = y === 39 ? 'jetLawn_0' : y >= 37 ? (top ? 'jetTop3_0' : 'jetFar_0') : `jet${top ? 'Top' : ''}${Math.max(1, bandOf(y))}_0`;
      m.set(x, y, name);
    }
  m.rect(28, 32, 3, 8, 'hedgeWall');
  m.rect(28, 31, 3, 1, 'hedgeTopWall');
  m.set(33, 39, 'parkSign');

  // Kids on the bench: one has Doc Leo's shoes, both would love to see a sit.
  m.set(35, 39, 'bench').set(36, 39, 'bench');
  m.set(35, 38, 'kidBench').set(36, 38, 'kidBench2');
  m.mon(37, 37, 'askShoes');
  m.mon(34, 37, 'askSit');
  m.set(32, 38, 'lampTop').set(32, 39, 'lamp');

  // The duck pond and the covered bridge. A rock by the near bank lets a wet dog out of
  // the water; the far bank is too high to climb out of it, so the geese must be faced.
  const p0 = 43;
  const p1 = 56;
  m.rect(p0, 39, p1 - p0 + 1, 1, (x) => `surface_${x % 2}`);
  m.rect(p0, G, p1 - p0 + 1, 4, (x, y) => `pond_${(x + y) % 2}`);
  m.rect(p0, G + 4, p1 - p0 + 1, 1, 'pondBed');
  m.set(p0 - 1, 39, 'rock').rect(p0 - 1, G, 1, 5, 'bank');
  m.rect(p1 + 1, 37, 2, 3, 'bank');
  m.rect(p1 + 1, 36, 2, 1, 'bankTop');
  m.rect(p1 + 1, G, 2, 5, 'bank');
  // stairs up, the bridge (its walkway is one block high), stairs down
  for (let i = 0; i < 3; i++) m.rect(p0 - 4 + i, 39 - i, 1, i + 1, 'stair');
  m.rect(p0 - 1, 37, p1 - p0 + 2, 1, 'bridge');
  m.rect(p0 - 1, 36, p1 - p0 + 2, 1, 'bridgeInside');
  m.rect(p0 - 1, 35, p1 - p0 + 1, 1, 'bridgeRoof');
  for (let i = 0; i < 4; i++) m.rect(p1 + 3 + i, 36 + i, 1, 4 - i, 'stair');
  m.mon(p0 + 4, 36, 'goose');
  m.mon(p0 + 9, 36, 'goose');
  m.mon(p0 + 2, 39, 'duck');
  m.mon(p0 + 8, 39, 'duck');

  // The picnic, the frisbee girl, Gwin in the mud.
  m.set(65, 39, 'picnic').set(66, 39, 'basket').set(68, G, 'mud').set(69, G, 'mud').set(70, G, 'mud');
  m.mon(67, 39, 'gwinMud');
  m.set(76, 39, 'frisbeeKid');
  m.set(74, 38, 'lampTop').set(74, 39, 'lamp');

  // The park gate, Pockets and the Klown Car.
  const car = 84;
  m.set(car - 2, 37, 'pocketsWant')
    .set(car - 2, 38, 'pocketsHead')
    .set(car - 2, 39, 'pocketsBody');
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.rect(87, 32, 1, 8, 'gatePost');
  m.set(87, 31, 'gateTop');

  m.mon(12, 32, 'squirrel');
  m.mon(18, G, 'plug');
  m.mon(19, G, 'plug');
  m.mon(20, G + 2, 'buried');
  const treats: [number, number][] = [
    [7, 39],
    [9, 37],
    [10, 37],
    [9, 34],
    [12, 32],
    [13, 32],
    [15, 39],
    [17, G + 1],
    [19, G + 1],
    [20, G + 1],
    [21, G + 1],
    [22, G + 1],
    [24, 39],
    [26, 33],
    [27, 33],
    [29, 30],
    [30, 30],
    [33, 38],
    [p0 + 2, 36],
    [p0 + 6, 36],
    [p0 + 7, 36],
    [p0 + 11, 36],
    [p0 + 12, 36],
    [p1 + 1, 35],
    [p1 + 2, 35],
    [63, 38],
    [64, 38],
    [71, 39],
    [72, 39],
    [78, 39],
    [79, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  // Doc Leo's balloon dogs, floated loose from the suitcase: up high, worth a detour.
  for (const [x, y] of [[12, 32], [30, 30], [p1 + 2, 35]]) m.mon(x, y, 'poodle');
  m.mark('start', 5, 39);
  m.mark('exit', car, 39);
  return {
    file: 'park',
    title: 'Puddlewick Park',
    time: 'afternoon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [31, 35],
    pose: [37, 39, 'frontBeg'],
  };
}
