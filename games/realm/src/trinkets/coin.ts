// The coin of the realm: King Dillydally IX's crown over his numeral on a gold disc with a raised rim.
import { circle2, polygon2, pixelText2, union2, type D2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 19;
const THICK = 3;
const RIM = { width: 1.9, height: 0.8 };
const RELIEF = 0.8;
const GOLD: Rgb = [236, 190, 62];
const BRONZE: Rgb = [140, 84, 30];

/** The crown: a band with three points, a ball on each, and jewels sunk in the band. */
const crown: D2 = union2(
  polygon2([
    [-8, -3],
    [-8, 9],
    [-4, 4],
    [0, 10.5],
    [4, 4],
    [8, 9],
    [8, -3],
  ]),
  circle2(1.2, -8, 9.4),
  circle2(1.4, 0, 11),
  circle2(1.2, 8, 9.4),
);
const jewels: D2 = union2(circle2(1, -4, 0), circle2(1, 0, 0), circle2(1, 4, 0));
const numeral: D2 = pixelText2(['IX'], 2, 0, -10);
const relief = union2(crown, numeral);
const coin = plate({
  outline: circle2(R),
  thick: THICK,
  rim: RIM,
  relief: { shape: relief, height: RELIEF },
  engrave: { shape: jewels, depth: 1.6 },
});

export const crownCoin = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(coin(x, y, z), -z),
  colorAt: (x, y, z) => (z > THICK - 0.2 && relief(x, y) < 0.15 ? BRONZE : GOLD),
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  bodyCell: 0.3,
  palette: [GOLD, BRONZE],
});
