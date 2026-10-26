// Level 9's background blocks, Doc Leo's backyard in the afternoon and the ground under it:
// the lawn, a tree, the old well's stone head (capped) and Gwinn's doghouse up top; under the
// grass, dark earth (solid), gray rock (solid, and no dig gets through it), the tunnels she
// digs (her soft-dirt and clay plugs, the roots and the moles are monsters), the old well's
// stone shaft with the step beside its bucket, the tunnel from the top of the well to her
// den, and the gift box there that takes her best bone. Her best bone itself is the errand.
import { Pixels } from '../../../kit/pixels';
import { blob, micro } from '../art/draw';
import { Tiles } from './level';
import { buried, c, canvas, cloud, copy, cut, dirt, grassTop, hedge, leaves, picket, r, sky, trunk, tuft } from '../blocks/tiles';
import { bandAt, sign, wideSign } from './common';
import { art } from './parts';
import { CTR } from '../ids';
import { cave as caveArt } from '../sprites/burrow';

/** The backyard's ground row (the surface she starts on is the row above). */
export const S = 24;

export const skyAt = (y: number) => `sky${bandAt(y, S)}`;

export function digTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(2, part, 29));
  t.wall('grass', grassTop(61));
  t.air('lawn', tuft(sky(3), 62));
  t.air('lawnFlower', tuft(sky(3), 63, 'yellow'));
  t.air('picket', picket(tuft(sky(3), 64), true));
  t.wall('hedgeWall', hedge(false, 25));
  t.wall('hedgeTop', hedge(true, 21, sky(bandAt(S - 11, S))));

  // Under the grass: dark earth (solid), and a few things buried in it for looks.
  t.wall('earth', dirt(65, true));
  t.wall('earthWorm', buried('worm', 66, true));
  t.wall('earthBall', buried('ball', 68, true));
  t.wall('earthRoots', buried('roots', 69, true));
  // Gray rock: solid, and nothing digs it (go round).
  t.wall(
    'rock',
    (() => {
      const p = new Pixels(20, 20, c('stone', 0));
      blob(p, 6, 6, 7, 6, r('stone'), 1, 3);
      blob(p, 15, 13, 6, 6, r('stone'), 1, 3);
      blob(p, 4, 16, 4, 3, r('stone'), 1, 2);
      p.line(2, 3, 5, 1, c('stone', 4)).line(12, 9, 16, 8, c('stone', 4));
      return p;
    })(),
  );
  // The tunnels she digs: dark, with crumbs of earth on the walls.
  const cave = caveArt();
  t.air('cave', cave);
  t.air(
    'caveFloor',
    (() => {
      const p = copy(cave);
      for (let x = 0; x < 20; x += 3) p.set(x, 19, c('dirt', 2)).set(x + 1, 18, c('dirt', 1));
      return p;
    })(),
  );
  // The big tree's roots in the hollow under it: hanging, and thick ones to stand on.
  t.air(
    'rootsHang',
    (() => {
      const p = copy(cave);
      p.line(3, 0, 5, 12, c('wood', 1)).line(5, 12, 3, 17, c('wood', 1)).line(12, 0, 11, 8, c('wood', 1)).line(16, 0, 18, 10, c('wood', 0));
      return p;
    })(),
  );
  t.ledge(
    'rootLedge',
    (() => {
      const p = copy(cave);
      p.rect(0, 1, 20, 5, c('wood', 2)).rect(0, 1, 20, 1, c('wood', 3)).rect(0, 6, 20, 1, c('wood', 0));
      p.line(4, 7, 6, 14, c('wood', 1)).line(14, 7, 13, 12, c('wood', 1));
      return p;
    })(),
  );
  // An earthworm's glow-in-the-dark mushroom, for light down there.
  t.air(
    'mushroom',
    (() => {
      const p = copy(cave);
      blob(p, 10, 13, 5, 3, r('glow'), 1, 3);
      p.rect(9, 15, 2, 5, c('fur', 2));
      return p;
    })(),
  );

  // The old well: stone shaft walls, the shaft, its step (stand there, ride the bucket), the
  // cap on top, and up on the lawn its little roof and crank.
  const stones = (seed: number) => {
    const p = new Pixels(20, 20, c('stone', 1));
    for (let y = 0; y < 20; y += 5) for (let x = (y / 5) % 2 ? -5 : 0; x < 20; x += 10) p.rect(x + 1, y + 1, 8, 3, c('stone', 2 + ((x + y + seed) % 2)));
    return p;
  };
  t.wall('wellWall', stones(0));
  t.air(
    'wellShaft',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(0, 0, 2, 20, c('stone', 1)).rect(18, 0, 2, 20, c('stone', 1));
      p.rect(9, 0, 1, 20, c('hay', 1));
      return p;
    })(),
  );
  t.ledge(
    'wellStep',
    (() => {
      const p = copy(cave);
      p.rect(0, 0, 20, 6, c('stone', 2)).rect(0, 0, 20, 1, c('stone', 4)).rect(0, 6, 20, 1, c('stone', 0));
      return p;
    })(),
  );
  t.wall(
    'wellCap',
    (() => {
      const p = stones(1);
      p.rect(0, 0, 20, 5, c('wood', 2)).rect(0, 0, 20, 1, c('wood', 3)).rect(0, 5, 20, 1, c('wood', 0));
      return p;
    })(),
  );
  // the well head on the lawn: a stone ring (a wall to hop), two posts, a shingle roof, a crank
  t.wall(
    'wellRing',
    (() => {
      const p = copy(sky(3));
      p.rect(0, 6, 20, 14, c('stone', 1));
      for (let x = 0; x < 20; x += 7) p.rect(x + 1, 8, 5, 4, c('stone', 3)).rect(x + 4, 14, 5, 4, c('stone', 2));
      return p;
    })(),
  );
  art(
    t,
    'wellTop',
    3,
    2,
    (_bx, by) => sky(bandAt(S - 3 + by, S)),
    (p) => {
      for (let i = 0; i < 12; i++) p.rect(4 + i * 2, 12 - i, 52 - i * 4, 1, c('roof', 1 + (i % 2)));
      p.rect(8, 14, 2, 26, c('wood', 1)).rect(50, 14, 2, 26, c('wood', 1));
      p.rect(10, 22, 40, 2, c('wood', 0));
      p.rect(52, 20, 6, 2, c('metal', 2)).rect(56, 20, 2, 7, c('metal', 2));
      p.rect(29, 24, 1, 16, c('hay', 1));
    },
  );

  // The top of the well: the tunnel to her den, the gift box that takes the bone (a counter
  // gate: with the bone, it closes over it, bow and all, and lets her by), the den.
  t.wall(
    'giftOpen',
    (() => {
      const p = copy(cave);
      p.rect(3, 8, 14, 12, c('red', 2)).frame(3, 8, 14, 12, c('red', 0));
      p.rect(9, 8, 2, 12, c('yellow', 3));
      p.rect(1, 4, 7, 3, c('red', 3)).line(1, 7, 7, 4, c('red', 0));
      micro(p, 4, 12, '?', c('yellow', 3));
      return p;
    })(),
    { effect: CTR.clues, eamt: -1, touch: 'giftShut', score: 500 },
  );
  t.air(
    'giftShut',
    (() => {
      const p = copy(cave);
      p.rect(3, 9, 14, 11, c('red', 2)).frame(3, 9, 14, 11, c('red', 0));
      p.rect(9, 9, 2, 11, c('yellow', 3)).rect(3, 13, 14, 2, c('yellow', 3));
      blob(p, 7, 6, 3, 2, r('yellow'), 2, 3);
      blob(p, 13, 6, 3, 2, r('yellow'), 2, 3);
      p.rect(9, 5, 2, 3, c('yellow', 1));
      return p;
    })(),
  );
  t.air(
    'den',
    (() => {
      const p = copy(cave);
      p.rect(1, 14, 18, 6, c('purple', 1)).rect(1, 14, 18, 1, c('purple', 3));
      for (let x = 3; x < 18; x += 5) p.rect(x, 16, 2, 2, c('purple', 3));
      return p;
    })(),
  );
  t.air(
    'denHole',
    (() => {
      const p = new Pixels(20, 20, c('dirt', 0));
      p.rect(0, 0, 3, 20, c('dirt', 1)).rect(17, 0, 3, 20, c('dirt', 1));
      return p;
    })(),
  );
  // Gwinn's doghouse on the lawn: its sides and roof are solid (the way in is from below);
  // inside is her goal.
  const dh = canvas(3, 2, () => sky(3));
  for (let i = 0; i < 10; i++) dh.rect(2 + i * 3, 10 - i, 56 - i * 6, 1, c('roof', 1 + (i % 2)));
  dh.rect(4, 11, 52, 29, c('wood', 2)).frame(4, 11, 52, 29, c('wood', 0));
  for (let y = 15; y < 40; y += 5) dh.rect(5, y, 50, 1, c('wood', 1));
  dh.rect(22, 22, 16, 18, c('ink', 0));
  dh.rect(24, 34, 12, 6, c('purple', 1));
  micro(dh, 19, 14, 'GWINN', c('paint', 3));
  const dc = cut(dh);
  for (let bx = 0; bx < 3; bx++) t.wall(`doghouse${bx}0`, dc[0][bx]);
  t.wall('doghouse01', dc[1][0]);
  t.air('doghouse11', dc[1][1]);
  t.wall('doghouse21', dc[1][2]);

  // The tree and the back fence on the lawn.
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(71 + k, sky(k)));
  t.air('trunk', trunk(sky(3)));

  // The best bone, the errand (fetch it: F).
  t.clue('bestBone', 'bestBone', 'caveFloor');

  // Signs.
  const pair = (name: string, base: Pixels, words: string) => {
    const [a, b] = wideSign(base, words);
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  };
  pair('signDig', sky(3), 'SOFT DIRT:\nDOWN: DIG');
  pair('signClay', cave, 'HARD CLAY:\nDIG TWICE');
  pair('signRoots', cave, 'ROOTS:\n1: CHEW');
  pair('signMole', cave, 'MOLES:\nBOOF THEM');
  pair('signBucket', cave, 'BUCKET:\nRIDE UP');
  t.air('signGift', sign(cave, 'GIFT', 'right'));
  return t;
}
