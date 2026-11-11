// Nesting regressions: a rotated host, repeated names, round holes and a concave hole whose empty bounding box is misleading.
import { describe, expect, it } from 'vitest';
import { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { packKitStock } from '@lewismoten/gamemaker-sandbox-tools/kit/laserStock';
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { checkStockCuts } from './laserStockAssertions';

const rect = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
function part(name: string, w: number, h: number) {
  const p = new Part(name, w, h, 0.2);
  p.outline(rect(0, 0, w, h));
  return p;
}

describe('stock hole nesting', () => {
  it('rotates a tall host and its nested pieces together, preserving all quantities and cut spacing', () => {
    const host = part('host', 80, 200);
    host.hole('window', rect(10, 10, 60, 180));
    const guest = part('guest', 30, 40);
    const parts = [host, host, guest, guest, guest, guest];
    const before = JSON.stringify(parts.map((p) => p.sheet.items));
    const sheets = packKitStock(parts, '6x12');
    expect(
      sheets
        .flatMap((s) => s.placed)
        .filter((p) => p.name === 'host')
        .every((p) => p.turn === 90),
    ).toBe(true);
    checkStockCuts(sheets, '6x12', [
      { part: host, qty: 2 },
      { part: guest, qty: 4 },
    ]);
    for (const s of sheets)
      for (const g of s.placed.filter((p) => p.name === 'guest')) {
        expect(s.placed.some((h) => h.name === 'host' && g.x > h.x && g.y > h.y && g.x + g.w < h.x + h.w && g.y + g.h < h.y + h.h)).toBe(true);
      }
    expect(JSON.stringify(parts.map((p) => p.sheet.items))).toBe(before);
    expect(packKitStock(parts, '6x12').map((s) => s.placed)).toEqual(sheets.map((s) => s.placed));
  });

  it('fits a solid piece inside a circular hole with room for the cut hairlines', () => {
    const host = part('host', 70, 70);
    host.holeRound('round', 35, 35, 25);
    const guest = part('guest', 15, 15);
    const sheets = packKitStock([host, guest], '12x12');
    const [h, g] = sheets[0].placed;
    expect(g.x).toBeGreaterThan(h.x);
    expect(g.y).toBeGreaterThan(h.y);
    expect(g.x + g.w).toBeLessThan(h.x + h.w);
    checkStockCuts(sheets, '12x12', [
      { part: host, qty: 1 },
      { part: guest, qty: 1 },
    ]);
  });

  it('keeps a guest out of the wood crossing a concave hole’s bounding rectangle', () => {
    const host = part('host', 100, 100);
    host.hole('notched', [
      [10, 10],
      [90, 10],
      [90, 90],
      [55, 90],
      [55, 20],
      [45, 20],
      [45, 90],
      [10, 90],
    ]);
    const guest = part('guest', 60, 50);
    const sheets = packKitStock([host, guest], '12x12');
    const [h, g] = sheets[0].placed;
    expect(g.x >= h.x + h.w || g.y >= h.y + h.h || g.x + g.w <= h.x || g.y + g.h <= h.y).toBe(true);
    checkStockCuts(sheets, '12x12', [
      { part: host, qty: 1 },
      { part: guest, qty: 1 },
    ]);
  });
});
