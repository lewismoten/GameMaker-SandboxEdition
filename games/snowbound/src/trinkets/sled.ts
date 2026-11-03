// The Jamie Street sled: a red deck with gold slats, steel runners curling up at the front and a coil of rope.
// The runners' undersides rise at under 45 degrees, so it prints flat without supports.
import { figure } from '@lewismoten/gamemaker-sandbox-tools/mesh/figureShapes';
import { extrude, ring2, roundRect2, union2, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import type { FieldTrinketInput } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import type { Rgb } from '@lewismoten/gamemaker-sandbox-tools/mesh/colorBodies';

const RED: Rgb = [244, 72, 60];
const GOLD: Rgb = [244, 196, 64];
const STEEL: Rgb = [176, 188, 206];
const ROPE: Rgb = [196, 142, 88];

const DECK = 5.2;
const slats = union2(...[-20, -10, 0, 10, 20].map((y) => roundRect2(11.4, 3.2, 1, 0, y)));
const coil = (x: number, y: number) => ring2(3.2, 6.2)(x, y + 12);

/** A runner: 3.4 mm wide, 7.5 mm deep, the front rising from y = 26 at 1.2 (past 45 degrees). */
const runner =
  (side: number): D3 =>
  (x, y, z) => {
    const lift = Math.max(0, y - 26) * 1.2;
    const across = Math.abs(x - side * 15.2) - 1.7;
    const deep = Math.max(lift - z, z - lift - 7.5);
    const ends = Math.max(-30 - y, y - 34);
    return Math.max(across, deep, ends);
  };

const SLED = figure(
  [
    { d: extrude(roundRect2(15.4, 28, 4), 0, DECK), color: RED },
    { d: extrude(slats, 0, DECK + 1.4), color: GOLD },
    { d: runner(1), color: STEEL },
    { d: runner(-1), color: STEEL },
    { d: extrude(coil, 0, DECK + 3.4), color: ROPE },
  ],
  0.4,
);

export const jamieSled = (): FieldTrinketInput => ({
  mm: SLED.mm,
  colorAt: SLED.colorAt,
  box: { min: [-19, -33, -0.5], max: [19, 42, 22] },
  bodyCell: 0.4,
  palette: [RED, GOLD, STEEL, ROPE],
});
