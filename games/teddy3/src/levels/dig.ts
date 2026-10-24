// Level 9: MEANWHILE... Gwinn's Buried Treasure, under Doc Leo's backyard in the afternoon.
// Years ago Gwinn buried her best bone, deep. Now it's going to be Teddy's birthday present.
// The new idea is digging down through the layers: soft dirt (one big dig), hard clay (two),
// gray rock (no dig gets through it: go round), tree roots (chew them) and moles (BOOF).
// Teach: dig a shaft straight down from the lawn into a tunnel. Test: two ways down from it,
// through the rock: the left one through soft dirt and a tangle of roots, the right one
// through hard clay and past a mole, round a boulder. Both come out in a cavern (a balloon dog
// behind roots at its far end, for the curious), with a mole in it and hard clay in its
// floor; under that, roots across the next tunnel, then soft dirt and clay down into the
// pocket where the best bone is. Twist: the way back up. The old well's bucket goes up and
// down by itself: wait on the stone step beside it, step on when it is down, and ride it up
// (the well above is choked with roots, so it stops partway); step off into the hollow under
// the big tree beside the doghouse, climb its roots, chew through the last tangle, and the
// gift box in her den takes the bone (no bone, no way by: ride back down for it). Then up into
// her doghouse, the goal. Everywhere down here leads on down to the pocket, and the pocket to
// the well, so there is always a way on; there is room under the bucket's lowest point.
//
// The blocks are in digTiles.ts, the monsters in digBeasts.ts; this file lays out the map.
import { addEasterEgg } from '../sprites/hidden';
import { LevelMap, type Level } from './level';
import { S, digTiles, skyAt } from './digTiles';
import { bandAt } from './common';
import { WELL, digBeasts } from './digBeasts';
import { digSong } from '../sound/digSong';

/** Where things are, for the bot's route. */
export const DIG = {
  start: 10,
  shaft: 15,
  gapA: 19,
  rootsA: 21,
  downA: 23,
  gapB: 26,
  rockB: 32,
  downB: 35,
  down: 39,
  roots: 41,
  down2: 42,
  bone: 39,
  step: 44,
  well: 45,
  ledgeA: 48,
  ledgeB: 50,
  tangle: 52,
  gift: 53,
  exit: 54,
};
/** Rows: the tunnels and cavern going down, the bone's pocket, the bucket's low and top, the root ledges, the den. */
export const ROW = { tunnel: 27, layer: 30, cavern: 33, deep: 36, pocket: 39, low: 40, top: 40 - WELL.rise, ledgeA: 30, ledgeB: 27, den: 26 };

export function dig(): Level {
  const bs = digTiles();
  const beasts = digBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, S, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [12, 8],
    [30, 6],
    [48, 9],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, S, 100, 1, 'grass');
  m.rect(0, S + 1, 100, 100 - S - 1, 'earth');
  for (let x = 9; x < 56; x++) m.set(x, S - 1, x % 5 === 2 ? 'lawnFlower' : 'lawn');
  // things buried in the earth, for looks
  for (const [x, y, k] of [
    [11, 32, 'earthWorm'],
    [30, 26, 'earthWorm'],
    [39, 29, 'earthBall'],
    [18, 25, 'earthRoots'],
    [27, 25, 'earthRoots'],
    [28, 38, 'earthWorm'],
    [57, 29, 'earthBall'],
  ] as const)
    m.set(x, y, k);
  // the backyard's hedge closes it off at both ends (the map wraps around)
  m.rect(0, S - 10, 9, 10, 'hedgeWall');
  m.rect(0, S - 11, 9, 1, 'hedgeTop');
  m.rect(56, S - 10, 44, 10, 'hedgeWall');
  m.rect(56, S - 11, 44, 1, 'hedgeTop');

  // The lawn: the sign, the soft dirt where she starts digging, the back fence.
  m.set(DIG.shaft - 3, S - 1, 'signDigL').set(DIG.shaft - 2, S - 1, 'signDigR');
  for (let x = 30; x < 40; x++) m.set(x, S - 1, 'picket');

  // Teach: the shaft down from the lawn (two soft-dirt plugs), into the first tunnel, two
  // blocks high. (The engine pulls a dog into a one-wide gap, so a plug in one can't be walked
  // across, only dug or hopped over: the first tunnel is high enough to hop the left way's.)
  for (let y = S; y < ROW.tunnel - 1; y++) m.set(DIG.shaft, y, 'cave').mon(DIG.shaft, y, 'plug');
  m.rect(DIG.shaft - 2, ROW.tunnel - 1, DIG.gapB - DIG.shaft + 7, 1, 'cave');
  m.rect(DIG.shaft - 2, ROW.tunnel, DIG.gapB - DIG.shaft + 7, 1, 'caveFloor');
  m.set(DIG.shaft - 2, ROW.tunnel, 'signMoleL').set(DIG.shaft - 1, ROW.tunnel, 'signMoleR');
  m.mon(DIG.gapA + 2, ROW.tunnel, 'mole');

  // Test: the rock under the first tunnel, and two ways through it: the left (soft dirt, then
  // roots) and the right (hard clay, a mole, and a boulder to hop). Earth between them.
  m.rect(DIG.shaft - 3, ROW.tunnel + 1, 27, 2, 'rock');
  m.set(DIG.gapA - 2, ROW.tunnel, 'signRootsL').set(DIG.gapA - 1, ROW.tunnel, 'signRootsR');
  m.set(DIG.gapB + 1, ROW.tunnel, 'signClayL').set(DIG.gapB + 2, ROW.tunnel, 'signClayR');
  for (const y of [ROW.tunnel + 1, ROW.tunnel + 2]) m.set(DIG.gapA, y, 'cave').mon(DIG.gapA, y, 'plug');
  m.rect(DIG.gapA, ROW.layer, DIG.downA - DIG.gapA + 1, 1, 'cave');
  m.mon(DIG.rootsA, ROW.layer, 'roots').mon(DIG.rootsA + 1, ROW.layer, 'roots');
  m.set(DIG.downA, ROW.layer + 1, 'cave').mon(DIG.downA, ROW.layer + 1, 'plug');
  for (const y of [ROW.tunnel + 1, ROW.tunnel + 2]) m.set(DIG.gapB, y, 'cave').mon(DIG.gapB, y, 'clay');
  m.rect(DIG.gapB, ROW.layer, DIG.downB - DIG.gapB + 1, 1, 'cave');
  m.mon(DIG.gapB + 2, ROW.layer, 'mole');
  m.set(DIG.rockB, ROW.layer, 'rock');
  m.rect(DIG.rockB - 1, ROW.layer - 1, 3, 1, 'cave');
  m.set(DIG.downB, ROW.layer + 1, 'cave').mon(DIG.downB, ROW.layer + 1, 'plug');

  // The cavern: a balloon dog behind roots at its far end, a mole, and hard clay in its floor.
  const c0 = DIG.downA - 4;
  m.rect(c0, ROW.cavern - 1, DIG.step - c0, 1, 'cave');
  m.rect(c0, ROW.cavern, DIG.step - c0, 1, 'caveFloor');
  m.rect(c0, ROW.cavern + 1, DIG.step - c0, 1, 'rock');
  m.mon(c0 + 2, ROW.cavern, 'roots');
  m.mon(c0, ROW.cavern, 'poodle');
  // the decorated Easter egg, tucked behind the roots with the balloon dog
  m.set(c0 + 1, ROW.cavern, addEasterEgg(bs, m.get(c0 + 1, ROW.cavern), 'dots', 'yellow', 'blue'));
  m.mon(DIG.downA + 5, ROW.cavern, 'mole');
  for (const x of [DIG.downA + 3, DIG.downA + 12, DIG.step - 2]) m.set(x, ROW.cavern, 'mushroom');
  m.set(DIG.down, ROW.cavern + 1, 'cave').mon(DIG.down, ROW.cavern + 1, 'clay');
  m.set(DIG.down, ROW.cavern + 2, 'cave').mon(DIG.down, ROW.cavern + 2, 'plug');
  // the deep tunnel: roots across it, then soft dirt and clay down to the bone's pocket
  m.rect(DIG.down - 7, ROW.deep, DIG.step - DIG.down + 7, 1, 'caveFloor');
  m.rect(DIG.down - 7, ROW.deep + 1, DIG.step - DIG.down + 7, 2, 'rock');
  m.mon(DIG.roots, ROW.deep, 'roots');
  m.set(DIG.down2, ROW.deep + 1, 'cave').mon(DIG.down2, ROW.deep + 1, 'plug');
  m.set(DIG.down2, ROW.deep + 2, 'cave').mon(DIG.down2, ROW.deep + 2, 'clay');
  m.rect(DIG.down - 3, ROW.pocket, DIG.step - DIG.down + 4, 1, 'caveFloor');
  m.rect(DIG.down - 3, ROW.pocket + 1, DIG.step - DIG.down + 3, 1, 'rock');
  m.set(DIG.bone, ROW.pocket, 'bestBone');
  m.set(DIG.step - 2, ROW.pocket, 'signBucketL').set(DIG.step - 1, ROW.pocket, 'signBucketR');
  m.set(DIG.down - 2, ROW.pocket, 'mushroom');

  // Twist: the old well. Its stone walls, the shaft (choked with roots above where the bucket
  // stops), the step, the room under the bucket's lowest point, the cap and the well head on
  // the lawn. The bucket starts at its low point.
  const w = DIG.well;
  for (let y = ROW.top - 2; y < ROW.pocket; y++) m.set(w - 1, y, 'wellWall');
  for (let y = ROW.top; y <= ROW.low + 2; y++) m.set(w + 1, y, 'wellWall');
  for (let y = ROW.top - 2; y <= ROW.low + 2; y++) m.set(w, y, 'wellShaft');
  for (let y = S + 1; y < ROW.top - 2; y++) m.set(w, y, 'earthRoots');
  m.set(w, ROW.low + 3, 'wellWall')
    .set(w - 1, ROW.low + 1, 'wellWall')
    .set(w - 1, ROW.low + 2, 'wellWall');
  m.set(DIG.step, ROW.low, 'wellStep');
  m.mon(w, ROW.low, 'bucket');
  m.set(w, S, 'wellCap');
  for (let x = w - 1; x <= w + 1; x++) m.set(x, S - 1, 'wellRing');
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 2; by++) m.set(w - 1 + bx, S - 3 + by, `wellTop${bx}${by}`);

  // The hollow under the big tree: its floor, two root ledges up, the tangle across the way to
  // her den, the gift box, the den and the hole up into the doghouse (its sides and roof are
  // solid; inside is the goal).
  m.rect(w + 1, ROW.den, DIG.tangle - w - 1, ROW.top - ROW.den, 'cave');
  for (let x = w + 1; x < DIG.tangle; x++) m.set(x, ROW.den, 'rootsHang');
  m.rect(DIG.ledgeA, ROW.ledgeA, 2, 1, 'rootLedge');
  m.rect(DIG.ledgeB, ROW.ledgeB, 2, 1, 'rootLedge');
  m.rect(w + 1, ROW.top, DIG.tangle - w - 1, 1, 'earth');
  m.set(DIG.tangle, ROW.den, 'cave').mon(DIG.tangle, ROW.den, 'roots');
  m.set(DIG.gift, ROW.den, 'giftOpen');
  m.set(DIG.exit, ROW.den, 'den');
  for (let y = S; y < ROW.den; y++) m.set(DIG.exit, y, 'denHole');
  for (let bx = 0; bx < 3; bx++) m.set(DIG.gift + bx, S - 2, `doghouse${bx}0`);
  m.set(DIG.gift, S - 1, 'doghouse01')
    .set(DIG.exit, S - 1, 'doghouse11')
    .set(DIG.exit + 1, S - 1, 'doghouse21');
  // the big tree beside the doghouse (its roots are the hollow's)
  const tree = DIG.ledgeB;
  for (let y = S - 3; y < S; y++) m.set(tree, y, 'trunk');
  for (let dy = -3; dy <= 0; dy++)
    for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy + 1) < 4) m.set(tree + dx, S - 4 + dy, `leaf${bandAt(S - 4 + dy, S)}`);

  // Treats along the way.
  const treats: [number, number][] = [
    [DIG.start + 1, S - 1],
    [DIG.shaft - 1, S - 1],
    [DIG.shaft + 1, ROW.tunnel],
    [DIG.gapA, ROW.tunnel - 1],
    [DIG.gapB - 1, ROW.tunnel],
    [DIG.gapB + 4, ROW.tunnel],
    [DIG.gapA + 1, ROW.layer],
    [DIG.gapB + 1, ROW.layer],
    [DIG.rockB, ROW.layer - 1],
    [DIG.downB - 1, ROW.layer],
    [DIG.downA + 2, ROW.cavern],
    [DIG.downA + 4, ROW.cavern - 1],
    [DIG.downA + 9, ROW.cavern],
    [DIG.downA + 13, ROW.cavern],
    [DIG.down, ROW.cavern],
    [DIG.down - 4, ROW.deep],
    [DIG.down2, ROW.deep],
    [DIG.down - 1, ROW.pocket],
    [DIG.bone + 2, ROW.pocket],
    [DIG.ledgeA, ROW.ledgeA - 1],
    [DIG.ledgeB + 1, ROW.ledgeB - 1],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', DIG.start, S - 1);
  m.mark('exit', DIG.exit, S - 1);
  return {
    file: 'dig',
    hero: 'gwinn',
    title: "Gwinn's Buried Treasure",
    time: 'afternoon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [DIG.shaft - 2, ROW.tunnel - 3],
    pose: [DIG.shaft + 1, ROW.tunnel, 'gwinnRun1'],
    song: digSong,
    card: ['MEANWHILE, Gwinn digs up', 'her best bone for Teddy.', 'NEW: DIG DOWN THROUGH LAYERS'],
  };
}
