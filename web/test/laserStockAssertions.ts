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
    const cuts = s.placed.map((at) => {
      const one = new LaserSheet(s.sheet.w, s.sheet.h);
      placePart(one, parts.find((p) => p.part.name === at.name)!.part, at);
      return one.items.filter((it) => it.op === 'cut');
    });
    cuts.forEach((a, i) =>
      cuts.slice(i + 1).forEach((b) => {
        const pair = new LaserSheet(s.sheet.w, s.sheet.h);
        pair.items.push(...a, ...b);
        const bad = cutSpacingProblems(pair, gap + HAIRLINE).filter((p) => Number(p.a.slice(4)) < a.length && Number(p.b.slice(4)) >= a.length);
        expect(bad).toEqual([]);
      }),
    );
  }
}
