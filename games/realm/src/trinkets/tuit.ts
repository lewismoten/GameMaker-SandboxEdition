// The Royal Round Tuit, whole: one oak coin ringed in brass, as the game draws it on its title and in its intro
// (src/screens/scenery.ts tuit): TUIT carved round the top of the face, each letter upright, and a round boss in the
// middle. One piece, so it can ride in a pocket. Every wall stands straight up, so it prints flat without supports.
import { circle2, union2, type D2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 20;
const THICK = 4;
const RIM = { width: 2.4, height: 1 };
const CARVE = 0.9;
const BOSS = { r: 0.16 * R, height: 0.8 };
const OAK: Rgb = [178, 120, 66];
const BRASS: Rgb = [228, 186, 58];
const WALNUT: Rgb = [70, 40, 24];
const KNOT: Rgb = [120, 80, 36];

/** The letters as the game places them, on an arc over the top 0.58 of the way out (a little further apart, to print clear). */
const letters: D2 = union2(
  ...[...'TUIT'].map((ch, i) => {
    const a = Math.PI / 2 - ((i - 1.5) * Math.PI) / 4.6;
    return strokeText2([ch], 7, 1.6, Math.cos(a) * R * 0.58, Math.sin(a) * R * 0.58);
  }),
);
const coin = plate({
  outline: circle2(R),
  thick: THICK,
  rim: RIM,
  relief: { shape: circle2(BOSS.r), height: BOSS.height },
  engrave: { shape: letters, depth: CARVE },
});

export const tuit = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(coin(x, y, z), -z),
  colorAt: (x, y, z) => {
    const r = Math.hypot(x, y);
    if (r > R - RIM.width - 0.3) return BRASS;
    if (r < BOSS.r + 0.2 && z > THICK - 0.1) return KNOT;
    if (z < THICK + 0.05 && letters(x, y) < 0.15) return WALNUT;
    return OAK;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  palette: [OAK, BRASS, WALNUT, KNOT],
  // the colors follow the letters and the rim's edge closely, not in coarse steps
  bodyCell: 0.3,
});
