// Independent sheet checks: exact compensated cut distances across different pieces, quantities and cutter margins.
import { expect } from 'vitest';
import { cutSpacingProblems } from '@lewismoten/gamemaker-sandbox-tools/kit/laserClearance';
import { placePart, STOCK, type Part, type Placed, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { stockProblems } from '@lewismoten/gamemaker-sandbox-tools/kit/laserStock';
import { HAIRLINE, LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';

export function checkStockCuts(sheets: { sheet: LaserSheet; placed: Placed[] }[], stock: StockSize, parts: { part: Part; qty: number }[], gap = 4) {
  const placed = sheets.flatMap((s) => s.placed);
  for (const { part, qty } of parts) expect(placed.filter((p) => p.name === part.name)).toHaveLength(qty);
  for (const s of sheets) {
    expect(s.sheet.w).toBe(STOCK[stock].w);
    expect(s.sheet.h).toBe(STOCK[stock].h);
    expect(stockProblems(s.sheet)).toEqual([]);
    // Check all paths once and keep only distances between different placed pieces.
    const sheet = new LaserSheet(s.sheet.w, s.sheet.h);
    const owners: number[] = [];
    for (const [index, placement] of s.placed.entries()) {
      const one = new LaserSheet(s.sheet.w, s.sheet.h);
      placePart(one, parts.find((p) => p.part.name === placement.name)!.part, placement);
      for (const item of one.items) {
        if (item.op !== 'cut') continue;
        sheet.items.push(item);
        owners.push(index);
      }
    }
    const bad = cutSpacingProblems(sheet, gap + HAIRLINE).filter((p) => owners[Number(p.a.slice(4))] !== owners[Number(p.b.slice(4))]);
    expect(bad).toEqual([]);
  }
}
