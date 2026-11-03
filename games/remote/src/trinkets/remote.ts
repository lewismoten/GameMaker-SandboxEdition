// The remote, lying on its back: a charcoal clicker with a domed top, a red power button and infrared window, volume and channel
// rockers, a number pad, three color buttons, and a lanyard tab with a ring hole at the bottom. The domed body is cut flat
// on the bed and every button stands straight up, so it prints without supports.
import { figure } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { circle2, extrude, roundBox3, subtract3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const CHARCOAL: Rgb = [58, 60, 72];
const KEYS: Rgb = [196, 200, 208];
const RED: Rgb = [226, 48, 48];
const GREEN: Rgb = [60, 190, 90];

const body = roundBox3(0, 0, 3, 13, 46, 6.5, 4.5);
const tab = subtract3(extrude(circle2(6.4, 0, -49), 0, 5.5), extrude(circle2(2.4, 0, -49), -1, 8));
const TOP = 9.5;
const key = (x: number, y: number, r = 3): D3 => extrude(circle2(r, x, y), TOP - 2, TOP + 1.5);
const rocker = (x: number, y: number): D3 => roundBox3(x, y, TOP - 0.5, 3.4, 5.4, 1.6, 1.4);

const numbers = [14, 6.4, -1.2, -8.8].flatMap((y) => [-7.4, 0, 7.4].map((x) => key(x, y)));
const colors = [-7.4, 0, 7.4].map((x) => key(x, -17, 2.7));

const REMOTE = figure(
  [
    { d: body, color: CHARCOAL },
    { d: tab, color: CHARCOAL },
    ...numbers.map((d) => ({ d, color: KEYS })),
    { d: rocker(-5.2, 24), color: KEYS },
    { d: rocker(5.2, 24), color: KEYS },
    { d: colors[0], color: RED },
    { d: colors[1], color: GREEN },
    { d: colors[2], color: KEYS },
    { d: key(-6.4, 35.2, 3.4), color: RED },
    { d: roundBox3(0, 44.6, 4.6, 7.6, 2.6, 3, 1.2), color: RED },
  ],
  0.3,
);

export const theRemote = (): FieldTrinketInput => ({
  mm: REMOTE.mm,
  colorAt: REMOTE.colorAt,
  box: { min: [-15, -57, -0.5], max: [15, 49, 13] },
  bodyCell: 0.4,
  palette: [CHARCOAL, KEYS, RED, GREEN],
});
