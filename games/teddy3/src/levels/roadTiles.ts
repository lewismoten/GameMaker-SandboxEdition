// Level 7's background blocks, the River Road on a summer afternoon, at THE CHEZ's size: the
// riverside road with its reeds and willows, the river's fords (shallow water whose current
// runs back toward the near bank, over a stony bed), the jetties a car bumps back up
// through out of the water, the drawbridges' piers and the keeper's booth, the ferry's docks, and at the end
// the old mill's lane with its parking spot. The shared road blocks (chargers, hills) are in
// roadParts.ts; the bridge leaves, the ferry and the geese are monsters.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../art/draw';
import { GRAV, Tiles } from './level';
import { c, cloud, copy, dirt, hedge, r, sky } from '../blocks/tiles';
import { bandAt, sign, water, wideSign } from './common';
import { art } from './parts';
import { roadBlocks } from './roadParts';

/** The road's row: THE CHEZ drives on row 39. */
export const G = 40;

/** Sky over row y. */
export const skyAt = (y: number) => `sky${bandAt(y, G)}`;

/** River water at the road's level, the current running left (`ph` for the ripples). */
function ford(ph: number): Pixels {
  const p = water(true, ph, sky(bandAt(G, G)));
  for (let i = 0; i < 4; i++) {
    const x = (i * 6 + 20 - ph * 3) % 20;
    const y = 14 + ((i * 3) % 5);
    p.rect(x, y, 3, 1, c('paint', 3)).set(x - 1, y - 1, c('paint', 2));
  }
  return p;
}

/**
 * The end of the bank at the water: a plank jetty on posts, open underneath (a ledge: the car
 * drives on it, and one washed in under it bumps back up through it onto the road).
 */
function jetty(): Pixels {
  const p = ford(1);
  p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
  for (let x = 4; x < 20; x += 5) p.set(x, 2, c('wood', 1));
  for (const x of [1, 15]) p.rect(x, 5, 3, 15, c('wood', 1)).rect(x, 5, 1, 15, c('wood', 2));
  return p;
}

/**
 * The river's blocks (shared with Lookout Hill's gully): the ford's water (its current runs
 * back to the near bank), the stony bed under it, and the jetty at the near bank, which a car
 * washed in under it bumps back up through.
 */
export function riverBlocks(t: Tiles): void {
  for (const ph of [0, 1]) t.air(`ford${ph}`, ford(ph), { grav: GRAV.left | GRAV.down, next: `ford${1 - ph}`, ntime: 4 });
  t.wall(
    'bed',
    (() => {
      const p = dirt(14, true);
      for (let i = 0; i < 6; i++) blob(p, (i * 7) % 20, 4 + ((i * 5) % 12), 3, 2, r('stone'), 1, 3);
      return p;
    })(),
  );
  t.ledge('jetty', jetty());
}

export function roadTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(2, part, 5));
  const low = sky(bandAt(39, G));
  const hi = sky(bandAt(38, G));
  t.wall('dirt', dirt(6));
  t.wall('deep', dirt(8, true));
  t.air('hedgeTop', hedge(true, 31, sky(bandAt(29, G))));
  t.wall('hedgeWall', hedge(false, 33));
  roadBlocks(t, low, hi);

  // Reeds along the bank (the car drives in front of them).
  const reeds = copy(low);
  for (let k = 0; k < 7; k++) {
    const x = 1 + k * 3;
    const h = 8 + ((k * 5) % 7);
    reeds.rect(x, 20 - h, 1, h, c('grass', 1 + (k % 3)));
    if (k % 2) reeds.rect(x, 20 - h, 1, 3, c('wood', 1));
  }
  t.air('reeds', reeds);

  riverBlocks(t);

  // A willow, 3x4: a drooping crown over a trunk.
  art(
    t,
    'willow',
    3,
    4,
    (_bx, by) => sky(bandAt(36 + by, G)),
    (p) => {
      p.rect(27, 30, 6, 50, c('wood', 1)).rect(27, 30, 2, 50, c('wood', 2));
      for (const [x, y, rad] of [
        [30, 18, 16],
        [16, 28, 11],
        [44, 28, 11],
      ])
        blob(p, x, y, rad, rad - 3, r('leaf'), 0, 3, 0.8);
      for (let x = 6; x < 56; x += 3) p.rect(x, 24 + ((x * 7) % 9), 1, 20 + ((x * 5) % 14), c('leaf', 1 + (x % 2)));
    },
  );

  // The drawbridge's pier: a steel tower at the near bank with the hinge and a counterweight.
  art(
    t,
    'pier',
    1,
    4,
    (_bx, by) => sky(bandAt(36 + by, G)),
    (p) => {
      p.rect(3, 6, 14, 74, c('metal', 1)).rect(3, 6, 2, 74, c('metal', 3));
      for (let y = 10; y < 76; y += 12) p.line(4, y, 15, y + 10, c('metal', 2)).line(15, y, 4, y + 10, c('metal', 2));
      p.rect(1, 2, 18, 8, c('stone', 1)).frame(1, 2, 18, 8, c('ink', 0));
      p.disc(14, 72, 4, c('ink', 0)).disc(14, 72, 2, c('metal', 3));
    },
  );

  // The bridge keeper's booth, 2x2: a little hut with a window (the keeper waves from it).
  art(
    t,
    'booth',
    2,
    2,
    (_bx, by) => sky(bandAt(38 + by, G)),
    (p) => {
      p.rect(4, 8, 32, 32, c('paint', 2)).frame(4, 8, 32, 32, c('ink', 0));
      for (let y = 0; y < 9; y++) p.rect(2 + y, y, 36 - 2 * y, 1, c('roof', 2));
      p.rect(9, 14, 14, 10, c('sky', 5)).frame(9, 14, 14, 10, c('ink', 0));
      // the keeper: cap and face at the window
      p.disc(16, 21, 3, c('skin', 2)).rect(12, 16, 8, 2, c('blue', 1));
      p.rect(26, 20, 7, 20, c('wood', 2)).set(31, 30, c('gold', 2));
    },
  );

  // The ferry's dock: a wooden piling at the water's edge.
  const piling = copy(low);
  piling.rect(14, 2, 5, 18, c('wood', 1)).rect(14, 2, 5, 2, c('wood', 3)).rect(15, 8, 3, 1, c('wood', 0));
  piling.rect(9, 10, 6, 2, c('metal', 2));
  t.air('piling', piling);

  // The old mill at the end of its lane, 4x4: stone below, boards and a roof, the wheel turning.
  art(
    t,
    'mill',
    4,
    4,
    (_bx, by) => sky(bandAt(34 + by, G)),
    (p) => {
      for (let y = 0; y < 26; y++) p.rect(40 - 10 - y, y + 2, 20 + 2 * y, 1, c('roof', y % 4 === 3 ? 0 : 2));
      p.rect(8, 28, 64, 20, c('wood', 2));
      for (let y = 30; y < 48; y += 4) p.rect(8, y, 64, 1, c('wood', 1));
      p.rect(8, 48, 64, 32, c('stone', 2));
      for (let y = 52; y < 80; y += 6) for (let x = 8 + ((y / 6) % 2) * 5; x < 72; x += 10) p.rect(x, y, 1, 5, c('stone', 1));
      p.rect(34, 56, 12, 24, c('wood', 1)).frame(34, 56, 12, 24, c('ink', 0));
      p.rect(16, 34, 10, 8, c('glow', 2)).rect(54, 34, 10, 8, c('glow', 2));
      p.ring(74, 58, 9, c('wood', 1)).ring(74, 58, 6, c('wood', 2));
      for (let k = 0; k < 6; k++) p.line(74, 58, Math.round(74 + Math.cos(k) * 9), Math.round(58 + Math.sin(k) * 9), c('wood', 2));
    },
  );

  // The parking spot: a painted P on its post.
  const park = copy(sky(bandAt(36, G)));
  park.rect(9, 9, 2, 11, c('metal', 2));
  park.rect(4, 0, 12, 10, c('blue', 2)).frame(4, 0, 12, 10, c('paint', 3));
  park.rect(8, 2, 1, 6, c('paint', 3)).rect(9, 2, 2, 1, c('paint', 3)).rect(11, 3, 1, 2, c('paint', 3)).rect(9, 5, 2, 1, c('paint', 3));
  t.air('signP', park);
  const stripe = copy(hi);
  stripe.rect(0, 18, 20, 2, c('paint', 3));
  t.air('parkLine', stripe);

  // Signs.
  const [bridgeL, bridgeR] = wideSign(low, 'BRIDGE UP?\nHONK!');
  t.air('signBridgeL', bridgeL);
  t.air('signBridgeR', bridgeR);
  const [ferryL, ferryR] = wideSign(low, 'FERRY:\nDRIVE ON');
  t.air('signFerryL', ferryL);
  t.air('signFerryR', ferryR);
  const [firstL, firstR] = wideSign(low, 'CHARGE UP,\nTHEN HONK');
  t.air('signFirstL', firstL);
  t.air('signFirstR', firstR);
  t.air('signMill', sign(sky(bandAt(36, G)), 'MILL', 'right'));
  return t;
}
