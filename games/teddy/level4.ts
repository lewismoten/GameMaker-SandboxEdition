// Level 4: Downtown at sunset. Pigeons on the awnings, a subway steam vent that blows
// Teddy up to the fire escape where Doc Leo's horn landed, Biggles Department Store
// (spin the revolving doors to get through; Gwin is inside, in the shoe department), a
// sidewalk shed where Juggles the busker's pins come flying (play dead!), the plaza, a
// fruit stand Gwin already knocked over, and the Odeon, where the Klown Car waits.
import { Pixels, rng } from '../kit/pixels';
import { blob, micro, scaleBlit, speckle, sprite } from './draw';
import { FULL, docLeo } from './people';
import { CRITTERS } from './critters';
import { FLIP, type Bestiary } from './mons';
import { POWER } from './ids';
import { GRAV, LevelMap, Tiles, newBestiary, type Level } from './level';
import { askBubble, juggler, kid, pin, taxi } from './folks';
import { CK } from './klown';
import { bandOf } from './level1';
import { bricks, c, copy, cut, dirt, r, sky } from './tiles';

const G = 40;

function sidewalk(seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('stone'), 2, 1, seed, 0.2);
  p.rect(0, 0, 20, 2, c('stone', 3)).rect(0, 2, 20, 1, c('stone', 1));
  p.rect(seed % 2 ? 19 : 9, 0, 1, 20, c('stone', 0));
  p.rect(0, 16, 20, 4, c('stone', 1)).rect(0, 16, 20, 1, c('stone', 3));
  return p;
}

/** A far-off skyline band with lit windows. */
function skyline(top: boolean, seed: number): Pixels {
  const p = top ? sky(3) : new Pixels(20, 20, c('siding', 0));
  const R = rng(seed);
  if (top) {
    let x = 0;
    while (x < 20) {
      const w = 4 + Math.floor(R() * 6);
      const h = 6 + Math.floor(R() * 12);
      p.rect(x, 20 - h, w, h, c('siding', 0));
      x += w + 1;
    }
  }
  for (let y = top ? 10 : 1; y < 20; y += 3) for (let x = 1; x < 20; x += 3) if (R() < 0.35 && p.get(x, y) === c('siding', 0)) p.set(x, y, c('glow', 2));
  return p;
}

function facade(kind: 'brick' | 'stone', win: boolean, lit = false): Pixels {
  const p = kind === 'brick' ? bricks(7) : new Pixels(20, 20, c('stone', 3));
  if (kind === 'stone') for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('stone', 2));
  if (win) {
    p.rect(4, 3, 12, 14, c('stone', 1));
    p.rect(5, 4, 10, 12, lit ? c('glow', 2) : c('sky', 3));
    p.rect(9, 4, 2, 12, c('stone', 1));
    if (lit) p.rect(5, 11, 4, 5, c('glow', 1));
  }
  return p;
}

export function cityTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  t.air('skylineTop', skyline(true, 1));
  t.air('skylineTop2', skyline(true, 2));
  t.air('skyline', skyline(false, 3));
  t.air('skyline2', skyline(false, 4));
  t.wall('walk', sidewalk(1));
  t.wall('walk2', sidewalk(2));
  t.wall('road', speckle(new Pixels(20, 20), 0, 0, 20, 20, r('asphalt'), 1, 1, 5, 0.3));
  t.wall(
    'roadLine',
    (() => {
      const p = speckle(new Pixels(20, 20), 0, 0, 20, 20, r('asphalt'), 1, 1, 6, 0.3);
      p.rect(0, 9, 20, 2, c('paint', 3));
      return p;
    })(),
  );
  t.wall('deep', dirt(7, true));

  // Building faces behind the sidewalk (scenery) and in front (the store: solid).
  t.air('brick', facade('brick', false));
  t.air('brickWin', facade('brick', true, true));
  t.air('brickDark', facade('brick', true, false));
  t.wall('bldg', facade('brick', false));
  t.wall('bldgWin', facade('brick', true, true));
  t.wall('store', facade('stone', false));
  t.wall('storeWin', facade('stone', true, true));
  t.wall(
    'storeTop',
    (() => {
      const p = facade('stone', false);
      p.rect(0, 0, 20, 4, c('stone', 4)).rect(0, 4, 20, 1, c('stone', 1));
      return p;
    })(),
  );
  const storeSign = (word: string) => {
    const p = facade('stone', false);
    p.rect(0, 4, 20, 12, c('red', 1));
    micro(p, 10 - Math.floor((word.length * 4 - 1) / 2), 8, word, c('glow', 3));
    return p;
  };
  ['BIG-', 'GLES', 'DEPT', 'STORE'].forEach((w, i) => t.wall(`storeSign${i}`, storeSign(w)));
  // shop fronts with display windows
  t.air(
    'shopWin',
    (() => {
      const p = facade('brick', false);
      p.rect(1, 2, 18, 18, c('ink', 1)).rect(2, 3, 16, 16, c('glow', 1));
      blob(p, 6, 14, 3, 4, r('red'), 1, 3);
      blob(p, 13, 15, 3, 3, r('blue'), 1, 3);
      return p;
    })(),
  );
  t.air(
    'shopWin2',
    (() => {
      const p = facade('brick', false);
      p.rect(1, 2, 18, 18, c('ink', 1)).rect(2, 3, 16, 16, c('glow', 1));
      p.rect(4, 8, 4, 10, c('yellow', 2)).rect(11, 6, 5, 12, c('green', 1));
      return p;
    })(),
  );
  t.air(
    'shopDoor',
    (() => {
      const p = facade('brick', false);
      p.rect(4, 1, 12, 19, c('wood', 1)).rect(6, 3, 8, 8, c('glow', 2));
      return p;
    })(),
  );
  const awning = (col: string) => {
    const p = sky(2);
    for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 9, (x >> 2) % 2 ? c('paint', 3) : c(col, 2));
    for (let x = 0; x < 20; x += 4) blob(p, x + 2, 9, 2, 2, (x >> 2) % 2 ? [c('paint', 2), c('paint', 3)] : [c(col, 1), c(col, 2)], 0, 1);
    return p;
  };
  t.ledge('awnRed', awning('red'));
  t.ledge('awnBlue', awning('blue'));

  // The subway, its steam vent, the fire escape.
  t.air(
    'subway',
    (() => {
      const p = copy(t.pic('brick'));
      p.rect(1, 3, 18, 9, c('green', 0)).frame(1, 3, 18, 9, c('paint', 3));
      micro(p, 2, 5, 'SUBWY', c('paint', 3));
      return p;
    })(),
  );
  t.air(
    'subwayRail',
    (() => {
      const p = copy(t.pic('brick'));
      p.rect(0, 2, 20, 2, c('green', 1)).rect(2, 4, 2, 16, c('green', 1)).rect(16, 4, 2, 16, c('green', 1));
      p.rect(4, 10, 12, 10, c('ink', 0));
      return p;
    })(),
  );
  t.wall(
    'grate',
    (() => {
      const p = sidewalk(9);
      p.rect(2, 0, 16, 6, c('ink', 1));
      for (let x = 3; x < 18; x += 3) p.rect(x, 0, 1, 6, c('metal', 2));
      return p;
    })(),
  );
  for (const ph of [0, 1]) {
    const steam = (base: Pixels) => {
      const p = copy(base);
      const R = rng(30 + ph);
      for (let i = 0; i < 14; i++) blob(p, 4 + R() * 12, R() * 20, 2 + R() * 3, 2 + R() * 3, [c('cloud', 0), c('cloud', 1), c('cloud', 2)], 0, 2, 0.5);
      return p;
    };
    for (let k = 1; k < 4; k++) t.air(`steam${k}_${ph}`, steam(sky(k)), { grav: GRAV.up, next: `steam${k}_${1 - ph}`, ntime: 4 });
    t.air(`steamB_${ph}`, steam(t.pic('brick')), { grav: GRAV.up, next: `steamB_${1 - ph}`, ntime: 4 });
    t.air(`steamS_${ph}`, steam(t.pic('skyline')), { grav: GRAV.up, next: `steamS_${1 - ph}`, ntime: 4 });
  }
  t.ledge(
    'fireEscape',
    (() => {
      const p = copy(t.pic('brickDark'));
      p.rect(0, 0, 20, 2, c('ink', 1));
      for (let x = 1; x < 20; x += 3) p.rect(x, 2, 1, 3, c('ink', 1));
      p.line(0, 5, 19, 19, c('ink', 1));
      return p;
    })(),
  );
  t.air(
    'railing',
    (() => {
      const p = copy(t.pic('brick'));
      p.rect(0, 8, 20, 1, c('ink', 1));
      for (let x = 1; x < 20; x += 4) p.rect(x, 8, 1, 12, c('ink', 1));
      return p;
    })(),
  );
  t.prop('horn', 'horn', 'brick');

  // Inside the store: the lobby, Gwin's shoe-department mess, revolving doors.
  t.air(
    'lobby',
    (() => {
      const p = new Pixels(20, 20, c('pink', 3));
      for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 20, c('pink', 2));
      p.rect(0, 14, 20, 6, c('wood', 2)).rect(0, 14, 20, 1, c('wood', 4));
      return p;
    })(),
  );
  t.air(
    'lobbyLamp',
    (() => {
      const p = copy(t.pic('lobby'));
      p.rect(9, 0, 2, 5, c('gold', 1));
      blob(p, 10, 7, 5, 3, r('glow'), 1, 3);
      return p;
    })(),
  );
  t.air(
    'shoes',
    (() => {
      const p = copy(t.pic('lobby'));
      p.rect(2, 16, 6, 3, c('red', 2)).rect(9, 17, 5, 2, c('blue', 2)).rect(14, 15, 5, 4, c('paint', 3)).rect(4, 13, 3, 3, c('yellow', 2));
      return p;
    })(),
  );
  t.wall(
    'counter',
    (() => {
      const p = copy(t.pic('lobby'));
      p.rect(0, 4, 20, 16, c('wood', 1)).rect(0, 4, 20, 2, c('gold', 2)).rect(3, 8, 14, 9, c('glow', 1));
      p.rect(5, 10, 3, 6, c('pink', 1)).rect(11, 11, 3, 5, c('purple', 2));
      return p;
    })(),
  );
  t.wall(
    'floor',
    (() => {
      const p = new Pixels(20, 20, c('paint', 2));
      for (let i = 0; i < 20; i += 10) for (let j = 0; j < 20; j += 10) p.rect(i + ((j / 10) % 2) * 0, j, 10, 10, (i + j) % 20 ? c('ink', 1) : c('paint', 3));
      return p;
    })(),
  );
  t.air(
    'doorway',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(0, 0, 2, 20, c('gold', 1)).rect(18, 0, 2, 20, c('gold', 1)).rect(0, 0, 20, 2, c('gold', 1));
      return p;
    })(),
  );

  // The construction site: a plywood wall and a sidewalk shed (a one-block-high tunnel).
  t.wall(
    'plywood',
    (() => {
      const p = new Pixels(20, 20, c('wood', 3));
      for (let x = 0; x < 20; x += 10) p.rect(x, 0, 1, 20, c('wood', 1));
      p.set(4, 4, c('wood', 1)).set(15, 13, c('wood', 1));
      return p;
    })(),
  );
  t.wall(
    'plywoodSign',
    (() => {
      const p = copy(t.pic('plywood'));
      p.rect(1, 4, 18, 11, c('yellow', 3)).frame(1, 4, 18, 11, c('ink', 0));
      micro(p, 3, 7, 'WORK', c('ink', 0));
      return p;
    })(),
  );
  t.wall(
    'shedRoof',
    (() => {
      const p = new Pixels(20, 20, c('green', 0));
      p.rect(0, 14, 20, 6, c('green', 1)).rect(0, 14, 20, 1, c('green', 2));
      for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 14, c('green', 1));
      return p;
    })(),
  );
  t.air(
    'shed',
    (() => {
      const p = new Pixels(20, 20, c('ink', 1));
      p.rect(0, 0, 20, 3, c('green', 0)).rect(8, 3, 3, 17, c('metal', 1));
      p.rect(13, 12, 2, 2, c('glow', 3));
      return p;
    })(),
  );
  // Juggles the busker (pins come flying out of the bottom block).
  const jug = juggler(0);
  t.on('jugTop', jug.crop(0, 0, 20, 20), 'brick');
  t.on('jugBot', jug.crop(0, 20, 20, 20), 'brick', 'air', { birthMon: 0, birthTime: 0 });

  // The plaza: a hot dog cart, a billboard, a kid on a bench.
  t.wall(
    'cart',
    (() => {
      const p = copy(t.pic('skyline'));
      p.rect(1, 6, 18, 12, c('paint', 3)).rect(1, 6, 18, 2, c('red', 2));
      micro(p, 3, 10, 'HOT', c('red', 2));
      blob(p, 5, 18, 2, 2, r('ink'), 0, 1);
      blob(p, 15, 18, 2, 2, r('ink'), 0, 1);
      return p;
    })(),
  );
  t.air(
    'umbrella',
    (() => {
      const p = copy(t.pic('skylineTop'));
      for (let y = 8; y < 14; y++) for (let x = 10 - (y - 8) * 2; x < 10 + (y - 8) * 2; x++) p.set(x, y, (x >> 2) % 2 ? c('yellow', 3) : c('red', 2));
      p.rect(9, 14, 2, 6, c('metal', 2));
      return p;
    })(),
  );
  t.ledge(
    'billboard',
    (() => {
      const p = sky(2);
      p.rect(0, 0, 20, 3, c('metal', 2)).rect(0, 3, 20, 1, c('ink', 1));
      p.rect(9, 4, 2, 16, c('metal', 1));
      return p;
    })(),
  );
  // The billboard: Doc Leo's face and the Big Show.
  const bb = new Pixels(60, 60, c('blue', 2));
  bb.frame(0, 0, 60, 60, c('paint', 3)).frame(1, 1, 58, 58, c('gold', 1));
  scaleBlit(bb, docLeo(FULL).crop(0, 0, 20, 16), 10, 6, 2);
  micro(bb, 6, 40, 'KLOWN KLUB', c('yellow', 3));
  micro(bb, 8, 48, 'BIG SHOW!', c('paint', 3));
  cut(bb).forEach((row, y) => row.forEach((px, x) => t.air(`bb${x}${y}`, px)));
  t.wall(
    'bench',
    (() => {
      const p = copy(t.pic('skyline'));
      p.rect(0, 7, 20, 3, c('wood', 3)).rect(2, 10, 2, 10, c('ink', 1)).rect(16, 10, 2, 10, c('ink', 1));
      return p;
    })(),
  );
  t.on('kidPlaza', kid('boy'), 'skyline');
  t.wall(
    'fruitCrate',
    (() => {
      const p = copy(t.pic('skyline'));
      p.rect(1, 6, 18, 14, c('wood', 3));
      for (let y = 6; y < 20; y += 4) p.rect(1, y, 18, 1, c('wood', 1));
      for (let x = 3; x < 18; x += 4) blob(p, x, 5, 2.2, 2.2, r(x % 8 === 3 ? 'red' : 'yellow'), 1, 3);
      return p;
    })(),
  );
  t.air(
    'apples',
    (() => {
      const p = copy(t.pic('skyline'));
      for (const [x, y, col] of [
        [3, 18, 'red'],
        [8, 17, 'yellow'],
        [13, 18, 'red'],
        [17, 17, 'green'],
      ] as [number, number, string][])
        blob(p, x, y, 2, 2, r(col), 1, 3);
      return p;
    })(),
  );

  // The Odeon: marquee lights blink.
  for (const ph of [0, 1]) {
    t.air(
      `marquee_${ph}`,
      (() => {
        const p = new Pixels(20, 20, c('red', 0));
        for (let x = 1; x < 20; x += 3)
          p.set(x, 1, (x / 3 + ph) % 2 >= 1 ? c('glow', 3) : c('glow', 0)).set(x, 18, (x / 3 + ph) % 2 >= 1 ? c('glow', 0) : c('glow', 3));
        return p;
      })(),
      { next: `marquee_${1 - ph}`, ntime: 6 },
    );
  }
  ['BIG', 'SHOW', 'TO-', 'NIGHT'].forEach((w, i) => {
    const p = copy(t.pic('marquee_0'));
    micro(p, 10 - Math.floor((w.length * 4 - 1) / 2), 7, w, c('paint', 3));
    t.air(`marqueeWord${i}`, p);
  });
  t.air(
    'poster',
    (() => {
      const p = facade('brick', false);
      p.rect(3, 1, 14, 18, c('paint', 3)).frame(3, 1, 14, 18, c('gold', 1));
      blob(p, 10, 7, 4, 4, r('fur'), 1, 2);
      p.set(10, 8, c('red', 2)).set(8, 6, c('ink', 0)).set(12, 6, c('ink', 0));
      p.rect(6, 12, 8, 5, c('purple', 2));
      return p;
    })(),
  );
  t.klownCar(
    (_bx, by) => (by === 0 ? t.pic('brick') : t.pic('brick')),
    'horn',
    t.pic('brick'),
    () => t.pic('brick'),
  );
  return t;
}

/** Revolving doors: solid until a spin sets one turning for a while; then it stops again. */
export function revolvingDoor(b: Bestiary): void {
  const K: Record<string, number> = { ...CK, g: c('glow', 2), G: c('glow', 3) };
  const doorPic = (phase: number) =>
    sprite(
      phase === 0
        ? [
            'ommmmmmmmmmmmmmmmmmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGgGGGGmmGGGGgGGGmo',
            'omGGgGGGmmGGGGGgGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'omGGGGGGmmGGGGGGGGmo',
            'ommmmmmmmmmmmmmmmmmo',
            'oooooooooooooooooooo',
          ]
        : phase === 1
          ? [
              '......ommmmmmo......',
              '......omGGGGmo......',
              '......omGgGGmo......',
              '......omGGgGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......omGGGGmo......',
              '......ommmmmmo......',
              '......oooooooo......',
            ]
          : [
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
              '.........mm.........',
            ],
      K,
    );
  b.pic('door', doorPic(0), { solid: 15 });
  b.pic('door1', doorPic(1));
  b.pic('door2', doorPic(2));
  // Revolving doors: a spin sets one turning for a while, then it stops again.
  b.add('revolve', { pics: [['door', 50]], power: POWER.door, becomes: 'revolving', upscore: 25 });
  b.add('revolving', {
    pics: [
      ['door1', 2],
      ['door2', 2],
      ['door1', 2],
      ['door', 1],
    ],
    power: POWER.friend,
    end: 60,
    becomes: 'revolve',
  });
}

export function cityBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('pigeon')) b.pic(name, px, name.startsWith('pigeonFly') ? {} : { hp: -8 });
  revolvingDoor(b);
  b.pic('pin1', pin(0), { hp: -8 }).pic('pin2', pin(1), { hp: -8 });
  const [ta0, tb0] = taxi(0);
  const [ta1, tb1] = taxi(1);
  b.pic('taxiA0', ta0).pic('taxiB0', tb0).pic('taxiA1', ta1).pic('taxiB1', tb1);
  b.pic('askSit1', askBubble('SIT?', undefined, 0)).pic('askSit2', askBubble('SIT?', undefined, 1));

  b.add('pin', {
    pics: [
      ['pin1', 2],
      ['pin2', 2],
    ],
    power: POWER.projectile,
    path: [[-10, 0, 6]],
    end: -1,
  });
  b.add('pigeon', {
    pics: [
      ['pigeon1', 5],
      ['pigeon2', 5],
    ],
    power: POWER.pest,
    path: [
      [2, 0, 1, 0],
      [0, 0, 1, FLIP],
    ],
    becomes: 'pigeonFly',
    upscore: 25,
  });
  b.add('pigeonFly', {
    pics: [
      ['pigeonFly1', 2],
      ['pigeonFly2', 2],
    ],
    power: 0,
    path: [
      [3, -3, 6],
      [8, -10, 6],
    ],
    end: -1,
  });
  b.add('taxiBack', {
    pics: [
      ['taxiB0', 2],
      ['taxiB1', 2],
    ],
    power: POWER.friend + 50,
    path: [[-100, 0, 4]],
    end: -2,
  });
  b.add('taxiFront', {
    pics: [
      ['taxiA0', 2],
      ['taxiA1', 2],
    ],
    power: POWER.friend + 50,
    path: [[-100, 0, 4]],
    end: -2,
  });
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
  b.add('gwinStore', {
    pics: [
      ['gwinRun1', 2],
      ['gwinRun2', 2],
    ],
    power: 90,
    path: [
      [6, 0, 5, 0],
      [0, 0, 5, FLIP],
    ],
    becomes: 'gwinGone',
  });
  b.add('gwinPigeons', {
    pics: [
      ['gwinRun1', 2],
      ['gwinRun2', 2],
    ],
    power: 90,
    path: [
      [4, 0, 4, 0],
      [0, 0, 4, FLIP],
    ],
    becomes: 'gwinGone',
  });
  return b;
}

export function city(): Level {
  const bs = cityTiles();
  const beasts = cityBeasts();
  const jb = bs.def('jugBot');
  jb.birthMon = beasts.id('pin');
  jb.birthTime = 44;
  const m = new LevelMap(bs, beasts, 'sky0');
  const R = rng(17);
  const pick = (...names: string[]) => names[Math.floor(R() * names.length)];
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandOf(y)}`);
  m.rect(0, 32, 100, 1, () => pick('skylineTop', 'skylineTop2'));
  m.rect(0, 33, 100, 7, () => pick('skyline', 'skyline2'));
  m.rect(0, G, 100, 1, () => pick('walk', 'walk2'));
  m.rect(0, G + 1, 100, 1, 'road');
  m.rect(0, G + 2, 100, 1, (x) => (x % 3 ? 'road' : 'roadLine'));
  m.rect(0, G + 3, 100, 100 - G - 3, 'deep');

  /** A building face behind the sidewalk, rows top..39. */
  const building = (x0: number, w: number, top: number) => {
    m.rect(x0, top, w, 40 - top, 'brick');
    for (let y = top + 1; y < 36; y += 2) for (let x = x0 + 1; x < x0 + w - 1; x += 2) m.set(x, y, R() < 0.6 ? 'brickWin' : 'brickDark');
  };
  // the ends of the street (the map wraps)
  m.rect(0, 22, 4, 18, 'bldg');
  m.rect(86, 22, 14, 18, 'bldg');
  for (let y = 23; y < 38; y += 3) {
    m.set(2, y, 'bldgWin');
    m.set(90, y, 'bldgWin').set(95, y, 'bldgWin');
  }

  // Shops with awnings; pigeons.
  building(5, 11, 30);
  m.set(6, 38, 'shopWin').set(6, 39, 'shopWin').set(7, 39, 'shopDoor').set(8, 38, 'shopWin2').set(8, 39, 'shopWin2');
  m.set(11, 38, 'shopWin').set(11, 39, 'shopWin').set(12, 39, 'shopDoor').set(13, 38, 'shopWin2').set(13, 39, 'shopWin2');
  m.rect(6, 36, 3, 1, 'awnRed');
  m.rect(11, 36, 4, 1, 'awnBlue');
  m.mon(9, 39, 'pigeon');
  m.mon(12, 35, 'pigeon');

  // The subway steam vent and the fire escape with the horn.
  building(16, 8, 26);
  m.set(16, 38, 'subway').set(16, 39, 'subwayRail');
  for (const x of [17, 18]) {
    m.set(x, G, 'grate');
    for (let y = 30; y < 40; y++) m.set(x, y, 'steamB_0');
  }
  m.rect(19, 31, 4, 1, 'fireEscape');
  m.rect(19, 30, 4, 1, 'railing');
  m.set(21, 30, 'horn');
  m.rect(19, 34, 4, 1, 'fireEscape');

  // Biggles Department Store: solid, tall, and the only way on is through it.
  const s0 = 24;
  const s1 = 38;
  m.rect(s0, 22, s1 - s0 + 1, 14, 'store');
  for (let y = 24; y < 35; y += 3) for (let x = s0 + 1; x < s1; x += 2) m.set(x, y, 'storeWin');
  m.rect(s0, 22, s1 - s0 + 1, 1, 'storeTop');
  for (let i = 0; i < 4; i++) m.set(s0 + 5 + i, 35, `storeSign${i}`);
  m.rect(s0, 36, 1, 3, 'store');
  m.rect(s1, 36, 1, 3, 'store');
  m.rect(s0 + 1, 36, s1 - s0 - 1, 4, 'lobby');
  for (let x = s0 + 3; x < s1; x += 4) m.set(x, 36, 'lobbyLamp');
  m.rect(s0 + 1, 36, s1 - s0 - 1, 1, 'store');
  for (let x = s0 + 3; x < s1; x += 4) m.set(x, 37, 'lobbyLamp');
  m.rect(s0, G, s1 - s0 + 1, 1, 'floor');
  m.set(s0, 39, 'doorway').set(s1, 39, 'doorway');
  m.mon(s0, 39, 'revolve');
  m.mon(s1, 39, 'revolve');
  m.set(s0 + 4, 39, 'counter').set(s0 + 9, 39, 'counter');
  m.set(s0 + 6, 39, 'shoes')
    .set(s0 + 7, 39, 'shoes')
    .set(s0 + 11, 39, 'shoes');
  m.mon(s0 + 5, 39, 'gwinStore');

  // The construction site: the sidewalk shed, and Juggles at the far end.
  const c0 = 40;
  const c1 = 48;
  m.rect(c0, 24, c1 - c0 + 1, 14, 'plywood');
  m.set(c0 + 2, 34, 'plywoodSign').set(c0 + 6, 34, 'plywoodSign');
  m.rect(c0, 38, c1 - c0 + 1, 1, 'shedRoof');
  m.rect(c0, 39, c1 - c0 + 1, 1, 'shed');
  building(49, 4, 30);
  m.set(50, 38, 'jugTop').set(50, 39, 'jugBot');

  // The plaza: a steam vent up to the billboard, the hot dog cart, a kid.
  for (let y = 30; y < 40; y++) m.set(55, y, y >= 33 ? 'steamS_0' : `steam${Math.max(1, bandOf(y))}_0`);
  m.set(55, G, 'grate');
  m.rect(56, 31, 3, 1, 'billboard');
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) m.set(56 + x, 28 + y, `bb${x}${y}`);
  m.set(58, 39, 'cart').set(58, 38, 'umbrella');
  m.set(61, 39, 'bench').set(61, 38, 'kidPlaza');
  m.mon(62, 37, 'askSit');
  m.mon(53, 39, 'pigeon');

  // The fruit stand Gwin knocked over, and Gwin still chasing pigeons.
  m.set(64, 39, 'fruitCrate').set(65, 39, 'apples').set(66, 39, 'apples').set(68, 39, 'fruitCrate').set(68, 38, 'fruitCrate');
  m.mon(69, 39, 'gwinPigeons');

  // The Odeon.
  building(71, 13, 28);
  ['BIG', 'SHOW', 'TO-', 'NIGHT'].forEach((_, i) => m.set(73 + i, 34, `marqueeWord${i}`));
  m.set(72, 34, 'marquee_0').set(77, 34, 'marquee_0');
  m.set(73, 37, 'poster').set(75, 37, 'poster');
  const car = 80;
  m.set(car - 2, 37, 'pocketsWant')
    .set(car - 2, 38, 'pocketsHead')
    .set(car - 2, 39, 'pocketsBody');
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');

  // Taxis going by.
  m.mon(30, G + 1, 'taxiBack').mon(29, G + 1, 'taxiFront');
  m.mon(80, G + 1, 'taxiBack').mon(79, G + 1, 'taxiFront');

  const treats: [number, number][] = [
    [6, 39],
    [7, 35],
    [8, 35],
    [12, 35],
    [13, 35],
    [15, 39],
    [20, 30],
    [22, 30],
    [20, 33],
    [21, 33],
    [s0 - 1, 39],
    [s0 + 2, 39],
    [s0 + 3, 39],
    [s0 + 8, 39],
    [s0 + 9, 38],
    [s0 + 12, 39],
    [s0 + 13, 39],
    [c0 + 2, 39],
    [c0 + 4, 39],
    [c0 + 6, 39],
    [52, 39],
    [56, 30],
    [57, 30],
    [58, 30],
    [60, 39],
    [63, 39],
    [67, 39],
    [70, 39],
    [72, 39],
    [74, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mon(66, G, 'buried');
  m.mark('start', 4, 39);
  m.mark('exit', car, 39);
  void blob;
  return {
    file: 'city',
    title: 'Downtown',
    time: 'sunset',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [36, 35],
    pose: [42, 39, 'dead'],
  };
}
