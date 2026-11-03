// A pocket-sized Teleport-A-Phone from the year 2000: a rounded aqua handset that lies flat on its broad back, with an ivory face,
// rotary dial holes, a 2000 seven-segment display, a quarter slot and a short leaning antenna. Every structural part overlaps the
// body; the only tall piece is the 4 mm-thick antenna, which rises at about 42 degrees and ends in a 5.5 mm lime signal ball.
import { figure, roundCone3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { circle2, extrude, roundBox3, subtract3, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const AQUA: Rgb = [62, 214, 202];
const IVORY: Rgb = [250, 242, 212];
const VIOLET: Rgb = [49, 30, 84];
const LIME: Rgb = [182, 234, 70];

const body = roundBox3(0, 0, 7, 22, 40, 7, 7);
const rearFoot = roundBox3(0, -33, 6, 18, 8, 6, 4);
const face = roundBox3(0, -1, 13, 17.5, 31, 2.6, 5);
const screen = roundBox3(0, 22, 15.2, 10.5, 4.8, 1.35, 2);
const quarterSlot = roundBox3(0, -25.5, 15.5, 4.2, 1.6, 1.1, 0.8);

const dialCenter: [number, number] = [0, -4.5];
const dialHoles = Array.from({ length: 8 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
  return extrude(circle2(1.85, dialCenter[0] + Math.cos(a) * 8, dialCenter[1] + Math.sin(a) * 8), 13.4, 17);
});
const dial = subtract3(extrude(circle2(12.2, ...dialCenter), 13.2, 17), ...dialHoles);
const hub = extrude(circle2(2.9, ...dialCenter), 13.2, 17.5);

const horizontal = (x: number, y: number): D3 => roundBox3(x, y, 17, 1.55, 0.55, 0.8, 0.35);
const vertical = (x: number, y: number): D3 => roundBox3(x, y, 17, 0.55, 1.35, 0.8, 0.35);
const segments = (digit: '0' | '2', x: number, y: number): D3[] => {
  const all = {
    a: horizontal(x, y + 2.7),
    b: vertical(x + 1.75, y + 1.35),
    c: vertical(x + 1.75, y - 1.35),
    d: horizontal(x, y - 2.7),
    e: vertical(x - 1.75, y - 1.35),
    f: vertical(x - 1.75, y + 1.35),
    g: horizontal(x, y),
  };
  return (digit === '2' ? ['a', 'b', 'g', 'e', 'd'] : ['a', 'b', 'c', 'd', 'e', 'f']).map((name) => all[name as keyof typeof all]);
};
const display = [...segments('2', -6.4, 22), ...segments('0', -2.15, 22), ...segments('0', 2.15, 22), ...segments('0', 6.4, 22)];

const antennaShaft = roundCone3(0, 34, 12.8, 2.25, 0, 42, 20, 2);
const antennaBall = roundCone3(0, 42, 20, 2.8, 0, 42.8, 20.8, 2.8);

const PHONE = figure(
  [
    { d: body, color: AQUA },
    { d: rearFoot, color: AQUA },
    { d: face, color: IVORY },
    { d: dial, color: VIOLET },
    { d: hub, color: VIOLET },
    { d: screen, color: VIOLET },
    { d: quarterSlot, color: VIOLET },
    ...display.map((d) => ({ d, color: LIME })),
    { d: antennaShaft, color: AQUA },
    { d: antennaBall, color: LIME },
  ],
  0.3,
);

export const pocketPhone = (): FieldTrinketInput => ({
  mm: PHONE.mm,
  colorAt: PHONE.colorAt,
  box: { min: [-24, -42, -0.5], max: [24, 46, 25] },
  bodyCell: 0.4,
  palette: [AQUA, IVORY, VIOLET, LIME],
});
