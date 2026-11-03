// The Royal Round Tuit: an oak disc ringed in brass, broken in three. Each piece is a wedge of the disc cut along a wavy
// line with a round tab one side and a matching socket the other, so the three press back together. Every wall stands
// straight up, so it prints flat without supports. The brass ring is the band around the edge, the lettering walnut.
import { circle2, pixelText2, union3, type D2, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { plate } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const R = 20;
const THICK = 4;
const RIM = { width: 2.4, height: 1 };
const RELIEF = 0.9;
const KERF = 0.3;
const TEXT_PX = 1.4;
const OAK: Rgb = [178, 120, 66];
const BRASS: Rgb = [228, 186, 58];
const WALNUT: Rgb = [70, 40, 24];

const text: D2 = pixelText2(['ROUND', 'TUIT'], TEXT_PX);
const disc = plate({ outline: circle2(R), thick: THICK, rim: RIM, relief: { shape: text, height: RELIEF } });

/** The tab: how far the cut is pushed sideways at distance r along its arm. */
const tab = (r: number) => 2.8 * Math.exp(-(((r - 11) / 2.2) ** 2));
const arm = (k: number) => {
  const a = ((90 + 120 * k) * Math.PI) / 180;
  return { ux: Math.cos(a), uy: Math.sin(a) };
};
/** Distance to the left of arm k's cut (positive counter-clockwise of it). */
const side = (k: number, x: number, y: number) => {
  const { ux, uy } = arm(k % 3);
  const along = x * ux + y * uy;
  const left = -x * uy + y * ux;
  return along > 0 ? left - tab(along) : left;
};

/** One of the three pieces (0..2): the wedge between arm k and the next, set apart from its neighbors by the kerf. */
const piece =
  (k: number): D3 =>
  (x, y, z) =>
    Math.max(disc(x, y, z), KERF - side(k, x, y), side(k + 1, x, y) + KERF);

const whole = union3(piece(0), piece(1), piece(2));

export const tuit = (): FieldTrinketInput => ({
  mm: (x, y, z) => Math.max(whole(x, y, z), -z),
  colorAt: (x, y, z) => {
    const r = Math.hypot(x, y);
    if (r > R - RIM.width - 0.3) return BRASS;
    if (z > THICK - 0.2 && text(x, y) < 0.15) return WALNUT;
    return OAK;
  },
  box: { min: [-R - 1, -R - 1, -0.5], max: [R + 1, R + 1, THICK + RIM.height + 1] },
  palette: [OAK, BRASS, WALNUT],
  // the cuts are 0.5 mm wide: sampled finer than that, or the pieces would join
  bodyCell: 0.3,
  pieces: 3,
});
