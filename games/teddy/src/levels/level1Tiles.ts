// Level 1's background blocks, Doc Leo's backyard: the lawn, the hedge, Doc Leo's house,
// Teddy's doghouse, the garden boxes, the clothesline, Gwinn's garbage-can mess, the old oak,
// the back fence with soft dirt under it, hint signs and the alley where the Klown Car
// waits. Also the helpers every level uses: GROUND (the map row the lawn starts on), the
// sky band for a row (bandOf) and a hint sign on a stake.
import { Pixels } from '../../../kit/pixels';
import { blob, micro } from '../art/draw';
import { Tiles } from './level';
import {
  boxFace,
  branch,
  bricks,
  buried,
  c,
  canvas,
  cloud,
  cut,
  dirt,
  grassTop,
  hedge,
  leaves,
  plankFence,
  r,
  siding,
  sky,
  trunk,
  tuft,
  tunnel,
  windowOn,
} from '../blocks/tiles';

export const GROUND = 40;

/** Sky band for map row y. */
export const bandOf = (y: number) => (y <= 30 ? 0 : y <= 33 ? 1 : y <= 36 ? 2 : 3);

export function sign(base: Pixels, words: string, arrow?: 'up' | 'down'): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  p.rect(9, 12, 2, 8, c('wood', 1));
  p.rect(0, 1, 20, 12, c('wood', 3)).frame(0, 1, 20, 12, c('wood', 0));
  p.rect(1, 2, 18, 1, c('wood', 4));
  const w = words.length * 4 - 1 + (arrow ? 4 : 0);
  const x = 10 - Math.floor(w / 2);
  micro(p, x, 5, words, c('ink', 0));
  if (arrow) {
    const ax = x + w - 2;
    p.rect(ax, 4, 1, 7, c('red', 2));
    const tip = arrow === 'up' ? 4 : 10;
    const dir = arrow === 'up' ? 1 : -1;
    p.set(ax - 1, tip + dir, c('red', 2))
      .set(ax + 1, tip + dir, c('red', 2))
      .set(ax - 2, tip + 2 * dir, c('red', 2))
      .set(ax + 2, tip + 2 * dir, c('red', 2));
  }
  return p;
}

export function backyardTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) {
    t.air(`sky${k}`, sky(k));
    for (let part = 0; part < 3; part++) t.air(`cloud${k}${part}`, cloud(k, part, k * 3 + 1));
  }
  // The lawn and the ground under it.
  t.wall('grass', grassTop(1));
  t.wall('grass2', grassTop(2));
  t.wall('dirt', dirt(3));
  t.wall('dirt2', dirt(4));
  t.wall('deep', dirt(5, true));
  t.wall('dirtRock', buried('rock', 51));
  t.wall('dirtRoots', buried('roots', 52));
  t.wall('dirtFossil', buried('fossil', 53, true));
  t.wall('dirtBall', buried('ball', 54));
  t.wall('dirtWorm', buried('worm', 55));
  t.air('tuft', tuft(sky(3), 11));
  t.air('tuft2', tuft(sky(3), 12));
  t.air('flowerP', tuft(sky(3), 13, 'pink'));
  t.air('flowerY', tuft(sky(3), 14, 'purple'));
  t.air('tunnel', tunnel(6));
  t.air('tunnel2', tunnel(7));
  t.air('hole', tunnel(8));
  // A hedge across the back of the yard (scenery).
  t.air('hedgeTop', hedge(true, 21));
  t.air('hedgeTop2', hedge(true, 22));
  t.air('hedge', hedge(false, 23));
  t.air('hedge2', hedge(false, 24));
  t.wall('hedgeWall', hedge(false, 25));

  // Doc Leo's house.
  t.wall('house', siding('siding'));
  t.wall('houseWin', windowOn(siding('siding'), false, 'red'));
  // The back door, two blocks tall: the frame runs round both halves, the knob on the lower one.
  const door = canvas(1, 2, siding('siding'));
  door.rect(3, 4, 14, 36, c('wood', 2)).frame(3, 4, 14, 36, c('wood', 0));
  door.rect(5, 7, 10, 10, c('wood', 1)).rect(5, 23, 10, 12, c('wood', 1));
  door.rect(13, 20, 2, 2, c('gold', 2));
  const [[doorT], [doorB]] = cut(door);
  t.wall('houseDoor', doorT);
  t.wall('houseDoorB', doorB);
  t.wall(
    'houseRoof',
    (() => {
      const p = sky(1);
      for (let y = 0; y < 20; y++) p.rect(0, y, 20 - Math.floor(y / 2) + 10, 1, y % 4 === 3 ? c('roof', 0) : c('roof', 2));
      return p;
    })(),
  );
  t.wall('chimney', bricks(9));

  // Teddy's doghouse: a red roof (stand on it) over a little wall with a door.
  const dog = canvas(2, 2, (bx, by) => (by === 0 ? t.pic('hedge') : tuft(sky(3), 30 + bx)));
  for (let y = 0; y < 20; y++) {
    const half = Math.floor(y * 1.0);
    dog.rect(20 - half - 2, 4 + y, half * 2 + 4, 1, y % 3 === 0 ? c('red', 1) : c('red', 2));
  }
  dog.rect(4, 20, 32, 20, c('wood', 3));
  for (let x = 4; x < 36; x += 5) dog.rect(x, 20, 1, 20, c('wood', 1));
  blob(dog, 20, 32, 7, 9, [c('ink', 0), c('ink', 0), c('ink', 1)], 0, 2, 0.2);
  dog.rect(13, 32, 15, 8, c('ink', 0));
  micro(dog, 11, 21, 'TEDDY', c('paint', 3));
  const [[rl, rr], [wl, wr]] = cut(dog);
  t.ledge('dogRoofL', rl);
  t.ledge('dogRoofR', rr);
  t.air('dogWallL', wl);
  t.air('dogWallR', wr);

  // The vegetable garden: boxes to hop up, tomato plants.
  t.wall('box', boxFace('wood', 3, 40));
  t.wall(
    'boxSoil',
    (() => {
      const p = boxFace('wood', 3, 41);
      p.rect(1, 1, 18, 4, c('dirt', 1));
      return p;
    })(),
  );
  const tomato = (() => {
    const p = new Pixels(20, 20, 255);
    p.rect(9, 2, 2, 18, c('wood', 2));
    for (const [x, y] of [
      [5, 6],
      [14, 9],
      [6, 13],
      [13, 15],
    ])
      blob(p, x, y, 4, 3, r('leaf'), 1, 3);
    for (const [x, y] of [
      [4, 9],
      [15, 12],
      [7, 16],
    ])
      blob(p, x, y, 2.2, 2.2, r('red'), 1, 3);
    return p;
  })();
  t.on('tomatoT', tomato, 'hedgeTop');
  t.on('tomatoH', tomato, 'hedge');

  // The clothesline: poles (scenery), the line (stand on it), laundry below.
  const pole = new Pixels(20, 20, 255).rect(9, 0, 3, 20, c('metal', 2)).rect(9, 0, 1, 20, c('metal', 4));
  // The pole's foot, planted in the lawn.
  t.air(
    'pole',
    (() => {
      const p = tuft(sky(3), 11);
      p.blit(pole, 0, 0, 255);
      p.rect(7, 18, 7, 2, c('metal', 1));
      return p;
    })(),
  );
  t.on('poleT', pole, 'hedgeTop');
  t.on('poleH', pole, 'hedge');
  t.ledge(
    'poleTop',
    (() => {
      const p = sky(2);
      p.rect(9, 2, 3, 18, c('metal', 2)).rect(2, 2, 17, 2, c('metal', 3));
      return p;
    })(),
  );
  t.ledge(
    'line',
    (() => {
      const p = sky(2);
      p.rect(0, 2, 20, 1, c('paint', 1));
      return p;
    })(),
  );
  t.ledge(
    'lineSock',
    (() => {
      const p = sky(2);
      p.rect(0, 2, 20, 1, c('paint', 1));
      p.rect(5, 1, 2, 3, c('wood', 1));
      p.rect(5, 3, 4, 9, c('red', 2)).rect(5, 10, 8, 4, c('red', 2)).rect(5, 6, 4, 2, c('paint', 3));
      p.rect(13, 1, 2, 3, c('wood', 1));
      p.rect(12, 3, 5, 12, c('blue', 2)).rect(12, 3, 5, 2, c('blue', 3));
      return p;
    })(),
  );
  // A sheet pegged over the line (a line block itself, stand on it) hanging down in front of the hedge.
  const sheet = canvas(2, 2, (_bx, by) => (by === 0 ? t.pic('line') : t.pic('hedgeTop')));
  sheet.rect(1, 2, 38, 24, c('paint', 3));
  for (let x = 3; x < 39; x += 6) sheet.rect(x, 2, 2, 24, c('pink', 2));
  sheet.rect(1, 25, 38, 1, c('paint', 1)).rect(1, 2, 38, 1, c('paint', 1));
  for (const x of [3, 19, 35]) sheet.rect(x, 1, 2, 3, c('wood', 1));
  const [[sheetL, sheetR], [sheetBL, sheetBR]] = cut(sheet);
  t.ledge('lineSheetL', sheetL);
  t.ledge('lineSheetR', sheetR);
  t.air('sheet', sheetBL);
  t.air('sheetR', sheetBR);
  t.wall(
    'basket',
    (() => {
      const p = sky(3);
      p.rect(1, 6, 18, 14, c('wood', 3));
      for (let y = 6; y < 20; y += 3) p.rect(1, y, 18, 1, c('wood', 1));
      for (let x = 1; x < 19; x += 4) p.rect(x, 6, 1, 14, c('wood', 2));
      p.rect(2, 3, 16, 3, c('paint', 3)).rect(4, 2, 6, 2, c('blue', 3));
      return p;
    })(),
  );

  // Gwinn's mess: garbage cans, one standing, two on their sides, trash everywhere.
  const can = (tipped: boolean) => {
    const p = tuft(sky(3), tipped ? 51 : 52);
    if (tipped) {
      p.rect(0, 8, 18, 12, c('metal', 2));
      for (let x = 2; x < 18; x += 4) p.rect(x, 8, 1, 12, c('metal', 1));
      p.rect(0, 8, 18, 1, c('metal', 4));
      p.rect(18, 7, 2, 13, c('metal', 3));
      p.rect(14, 16, 6, 4, c('paint', 2)).set(17, 15, c('yellow', 3)).set(15, 15, c('red', 2));
    } else {
      p.rect(3, 4, 14, 16, c('metal', 2));
      for (let x = 5; x < 17; x += 4) p.rect(x, 4, 1, 16, c('metal', 1));
      p.rect(2, 2, 16, 3, c('metal', 4)).rect(8, 0, 4, 2, c('metal', 3));
    }
    return p;
  };
  t.wall('can', can(false));
  t.wall('canTipped', can(true));
  t.on(
    'canStack',
    (() => {
      const p = can(true);
      const sk = tuft(sky(3), 51);
      return p.map((x, y, v) => (v === sk.get(x, y) ? 255 : v));
    })(),
    'hedge',
    'wall',
  );
  t.air(
    'trash',
    (() => {
      const p = tuft(sky(3), 53);
      p.rect(2, 16, 4, 3, c('paint', 3)).rect(9, 17, 3, 2, c('yellow', 2)).rect(14, 15, 4, 4, c('red', 1)).set(15, 16, c('paint', 3));
      p.line(6, 19, 9, 15, c('wood', 2));
      return p;
    })(),
  );

  // The old oak: trunk, branches to stand on, leaves all around.
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(60 + k, sky(k)));
  t.air('leafDark', leaves(65, new Pixels(20, 20, c('leaf', 0))));
  t.air('trunk', trunk(t.pic('hedgeTop')));
  t.air('trunkHedge', trunk(t.pic('hedge')));
  t.air('trunkLeaf', trunk(leaves(66, new Pixels(20, 20, c('leaf', 0)))));
  t.air(
    'roots',
    (() => {
      const p = trunk(tuft(sky(3), 67));
      p.rect(2, 16, 16, 4, c('wood', 1)).rect(0, 18, 20, 2, c('wood', 0));
      return p;
    })(),
  );
  for (let k = 1; k < 4; k++) t.ledge(`branch${k}`, branch(leaves(70 + k, sky(k))));
  t.wall(
    'stump',
    (() => {
      const p = tuft(sky(3), 75);
      p.rect(3, 6, 14, 14, c('wood', 2));
      p.rect(3, 6, 14, 3, c('wood', 4)).rect(5, 7, 10, 1, c('wood', 3));
      for (let y = 9; y < 20; y += 3) p.set(4 + (y % 5), y, c('wood', 0));
      return p;
    })(),
  );
  t.prop('hat', 'hat', 'leaf1');

  // The back fence (too tall to hop) and the soft dirt under it.
  t.wall('fence', plankFence(false));
  t.wall('fenceTop', plankFence(true));

  // Hint signs on stakes.
  t.air('signHop', sign(tuft(sky(3), 80), 'HOP', 'up'));
  t.air('signWoof', sign(tuft(sky(3), 81), 'WOOF!'));
  t.air('signDig', sign(tuft(sky(3), 82), 'DIG', 'down'));
  t.air('signFetch', sign(tuft(sky(3), 83), 'F!'));
  t.air('signCar', sign(tuft(sky(3), 84), 'TOWN'));

  // The alley: a gravel lane and the Klown Car.
  t.klownCar(
    (bx, by) => (by === 0 ? t.pic('hedge') : tuft(sky(3), 90 + bx)),
    'hat',
    t.pic('hedgeTop'),
    (by) => (by === 0 ? t.pic('hedge') : tuft(sky(3), 95)),
  );
  // (last, so every other block keeps its number) the alley hedge's top, up in the blue sky
  t.air('hedgeTopHi', hedge(true, 21, sky(0)));
  t.air('hedgeTopHi2', hedge(true, 22, sky(0)));
  return t;
}
