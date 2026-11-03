// Tests: the shared trinket kinds (mesh/trinketKinds, mesh/sdfShapes) mesh into closed solids that print without supports.
import { describe, expect, it } from 'vitest';
import { meshFieldTrinket } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import { circle2, pixelText2, union2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { die, plate, tagOutline } from '@lewismoten/gamemaker-sandbox-tools/mesh/trinketKinds';

const make = (mm: (x: number, y: number, z: number) => number, half: number, top: number) =>
  meshFieldTrinket(
    { mm: (x, y, z) => Math.max(mm(x, y, z), -z), colorAt: () => [200, 160, 60], box: { min: [-half, -half, -0.5], max: [half, half, top] }, bodyCell: 0.8 },
    0.7,
  );

describe('trinket kinds', () => {
  it('lettering is lit where its pixels are and clear elsewhere', () => {
    const t = pixelText2(['I'], 2);
    expect(t(0, 0)).toBeLessThan(0);
    expect(t(30, 30)).toBeGreaterThan(0);
  });
  it('a coin with a rim and raised art is one closed solid with no overhang', () => {
    const coin = plate({
      outline: circle2(12),
      thick: 2.5,
      rim: { width: 1.5, height: 0.6 },
      relief: { shape: union2(pixelText2(['TUIT'], 1.2)), height: 0.7 },
    });
    const t = make(coin, 13, 5);
    expect(t.report.badEdges).toBe(0);
    expect(t.report.pieces).toBe(1);
    expect(t.overhang.area).toBeLessThan(25);
  });
  it('a key tag has its hole through the plate', () => {
    const tag = plate({ outline: tagOutline(8, 12, 3), thick: 2.5, holes: [circle2(2, 0, 8)] });
    const t = make(tag, 14, 5);
    expect(tag(0, 8, 1)).toBeGreaterThan(0);
    expect(tag(0, 0, 1)).toBeLessThan(0);
    expect(t.report.badEdges).toBe(0);
  });
  it('a die is closed with its faces dimpled', () => {
    const d = die(16, 1.2);
    expect(d(0, 0, 16.5)).toBeGreaterThan(0);
    const t = make(d, 10, 18);
    expect(t.report.badEdges).toBe(0);
    expect(t.report.pieces).toBe(1);
  });
});
