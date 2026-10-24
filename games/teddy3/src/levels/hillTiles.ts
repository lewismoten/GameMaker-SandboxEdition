// Level 12's background blocks, Lookout Hill at sunset, at THE CHEZ's size: the road climbing
// in steps (the shared road blocks: chargers, hill feet, potholes), the pond at the bottom
// with the ferry's jetty and the gully near the top (the River Road's water blocks), a
// pasture fence where the cow grazes, pines, and at the top, the Klown Klub's Big Top.
import { blob } from '../art/draw';
import { Tiles } from './level';
import { c, cloud, copy, dirt, hedge, picket, r, sky } from '../blocks/tiles';
import { bandAt, sign, wideSign } from './common';
import { art } from './parts';
import { bolt, roadBlocks } from './roadParts';
import { riverBlocks } from './roadTiles';

/** The bottom road's row: THE CHEZ starts on row 39 and climbs to row 32. */
export const G = 40;

/** Sky band for row y: the warm horizon band reaches up over the whole climb. */
const band = (y: number) => bandAt(y, G - 8);
export const skyAt = (y: number) => `sky${band(y)}`;

export function hillTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(0, part, 7));
  const low = sky(3);
  t.wall('dirt', dirt(6));
  t.wall('deep', dirt(8, true));
  t.air('hedgeTop', hedge(true, 31, sky(band(21))));
  t.wall('hedgeWall', hedge(false, 33));
  roadBlocks(t, low, low);
  riverBlocks(t);

  // The pasture fence behind the road where the cow grazes, and a pine.
  t.air('fence', picket(low, true, 'wood'));
  art(
    t,
    'pine',
    2,
    3,
    () => low,
    (p) => {
      p.rect(18, 44, 4, 16, c('wood', 1));
      for (let k = 0; k < 4; k++) {
        const y = 4 + k * 10;
        const half = 6 + k * 4;
        for (let dy = 0; dy < 12; dy++) {
          const w = Math.round((half * dy) / 12);
          p.rect(20 - w, y + dy, 2 * w, 1, c('leaf', dy % 4 === 3 ? 0 : 1 + (k % 2)));
        }
      }
    },
  );

  // The Klown Klub's Big Top, 6x5: a striped tent with its flag, the gate open below.
  art(
    t,
    'bigTop',
    6,
    5,
    (_bx, by) => sky(band(28 + by)),
    (p) => {
      p.rect(59, 2, 2, 14, c('metal', 2));
      p.rect(61, 2, 12, 6, c('yellow', 3)).set(64, 4, c('red', 2)).set(67, 4, c('red', 2));
      for (let y = 14; y < 100; y++) {
        const half = y < 50 ? 6 + Math.round((y - 14) * 1.2) : 50;
        for (let x = 60 - half; x < 60 + half; x++) p.set(x, y, Math.floor((x + 4) / 8) % 2 ? c('red', 2) : c('paint', 3));
        if (y === 50) p.rect(10, y, 100, 3, c('yellow', 3));
      }
      // scalloped trim under the roof, the gate's dark opening and its flaps
      for (let x = 10; x < 110; x += 10) p.disc(x + 5, 53, 5, c('yellow', 2));
      p.rect(46, 66, 28, 34, c('ink', 1)).rect(46, 66, 28, 2, c('gold', 2));
      p.rect(40, 62, 6, 38, c('red', 1)).rect(74, 62, 6, 38, c('red', 1));
      for (let k = 0; k < 5; k++) p.disc(30 + k * 15, 40, 2, c('glow', 3));
    },
  );

  // The gully's rock.
  const rock = dirt(12);
  for (let i = 0; i < 4; i++) blob(rock, 3 + i * 5, 5 + ((i * 7) % 10), 4, 3, r('stone'), 1, 3);
  t.wall('rock', rock);

  // The parking spot at the Big Top's gate.
  const park = copy(low);
  park.rect(9, 9, 2, 11, c('metal', 2));
  park.rect(4, 0, 12, 10, c('blue', 2)).frame(4, 0, 12, 10, c('paint', 3));
  park.rect(8, 2, 1, 6, c('paint', 3)).rect(9, 2, 2, 1, c('paint', 3)).rect(11, 3, 1, 2, c('paint', 3)).rect(9, 5, 2, 1, c('paint', 3));
  t.air('signP', park);
  const stripe = copy(low);
  stripe.rect(0, 18, 20, 2, c('paint', 3));
  t.air('parkLine', stripe);

  // Signs.
  t.air('signCow', sign(low, 'COW!\nWAIT'));
  const three = copy(low);
  three.rect(9, 12, 2, 8, c('wood', 1));
  three.rect(0, 1, 20, 12, c('wood', 3)).frame(0, 1, 20, 12, c('wood', 0));
  for (const x of [2, 8, 14]) bolt(three, x, 2, c('orange', 2));
  t.air('signThree', three);
  const [ferryL, ferryR] = wideSign(low, 'FERRY:\nDRIVE ON');
  t.air('signFerryL', ferryL);
  t.air('signFerryR', ferryR);
  const [topL, topR] = wideSign(low, 'BIG TOP\nUP HILL');
  t.air('signTopL', topL);
  t.air('signTopR', topR);
  return t;
}
