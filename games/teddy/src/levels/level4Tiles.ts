// Level 4's background blocks, downtown at sunset: sidewalks, a far-off skyline band with
// lit windows, brick and stone facades and shop fronts, the subway steam vent and fire
// escape, the inside of Biggles Department Store (Gwinn's shoe-department mess), the
// construction site's sidewalk shed, Juggles and Presto (blocks that give birth to pins and
// doves), the plaza and its billboard, and the Odeon's blinking marquee.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, klubArt, micro, scaleBlit, speckle } from '../art/draw';
import { FULL, docLeo } from '../sprites/people';
import { GRAV, Tiles } from './level';
import { juggler, kid } from '../sprites/folks';
import { presto, split } from '../sprites/magic';
import { bricks, c, copy, cut, dirt, r, sky } from '../blocks/tiles';

export const G = 40;

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
  t.prop('chicken', 'chicken', 'brick');

  // Inside the store: the lobby, Gwinn's shoe-department mess, revolving doors.
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
  // Presto the magician on the plaza: doves flutter out of his hat (a magic trick for the crowd).
  const [pt, pb] = split(presto());
  t.on('prestoTop', pt, 'skyline');
  t.on('prestoBot', pb, 'skyline', 'air', { birthMon: 0, birthTime: 0 });

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
  micro(bb, 6, 40, klubArt('KLOWN KLUB'), c('yellow', 3));
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
    'chicken',
    t.pic('brick'),
    () => t.pic('brick'),
  );
  return t;
}
