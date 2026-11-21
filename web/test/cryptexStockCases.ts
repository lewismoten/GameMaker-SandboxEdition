// Each stock file builds its kit once. Set GM_CRYPTEX_ALL_STOCKS=1 for all part clearance checks.
import { beforeAll, expect, it } from 'vitest';
import { BED, STOCK, STOCK_MARGIN, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import type { Item } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { buildCryptex, type Built } from '../../games/year2000/laser/cryptexBuild';

export const sheetCounts = { '6x12': 4, '8x12': 3, '12x12': 2, '12x20': 1 } as const;
export const extent = (it: Item): number[][] =>
  it.k === 'poly'
    ? it.pts.map((p) => [...p])
    : [
        [it.cx - (it.k === 'ring' ? it.r1 : it.r), it.cy - (it.k === 'ring' ? it.r1 : it.r)],
        [it.cx + (it.k === 'ring' ? it.r1 : it.r), it.cy + (it.k === 'ring' ? it.r1 : it.r)],
      ];

export const allStockChecks = process.env.GM_CRYPTEX_ALL_STOCKS === '1';

export function stockCases(stock: StockSize) {
  let kit: Built;
  beforeAll(
    () => {
      kit = buildCryptex(0.2, allStockChecks, stock);
    },
    allStockChecks ? 300000 : 60000,
  );
  it(`places every part within the cutter margins on ${stock} stock`, () => {
    const b = kit;
    expect(b.problems).toEqual([]);
    const placed = b.sheets.flatMap((s) => s.placed);
    for (const m of Object.values(b.parts)) expect(placed.filter((p) => p.name === m.part.name)).toHaveLength(m.qty);
    expect(placed).toHaveLength(Object.values(b.parts).reduce((a, m) => a + m.qty, 0));
    for (const s of b.sheets) {
      expect(s.sheet.w).toBe(STOCK[stock].w);
      expect(s.sheet.h).toBe(STOCK[stock].h);
      expect(s.sheet.w - 2 * STOCK_MARGIN.x).toBeLessThanOrEqual(BED.w);
      expect(s.sheet.h - 2 * STOCK_MARGIN.y).toBeLessThanOrEqual(BED.h + 1e-6);
      // Compare the extrema once per sheet; every vertex contributes to each bound.
      const bounds = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
      for (const item of s.sheet.items) {
        for (const [x, y] of extent(item)) {
          bounds.left = Math.min(bounds.left, x);
          bounds.right = Math.max(bounds.right, x);
          bounds.top = Math.min(bounds.top, y);
          bounds.bottom = Math.max(bounds.bottom, y);
        }
      }
      expect(bounds.left).toBeGreaterThanOrEqual(STOCK_MARGIN.x - 1e-6);
      expect(bounds.top).toBeGreaterThanOrEqual(STOCK_MARGIN.y - 1e-6);
      expect(bounds.right).toBeLessThanOrEqual(s.sheet.w - STOCK_MARGIN.x + 1e-6);
      expect(bounds.bottom).toBeLessThanOrEqual(s.sheet.h - STOCK_MARGIN.y + 1e-6);
    }
    expect(b.sheets).toHaveLength(sheetCounts[stock]);
    expect(b.area.sheets).toBeCloseTo(sheetCounts[stock] * STOCK[stock].w * STOCK[stock].h, 6);
  });
  it.skipIf(stock !== '12x12' && !allStockChecks)('packs discs by their circles: at most 4, 3, 2 and 1 sheets, none overlapping within 2 mm', () => {
    expect(kit.sheets.length, stock).toBeLessThanOrEqual(sheetCounts[stock]);
    expect(
      kit.problems.filter((p) => /apart|outside/.test(p)),
      stock,
    ).toEqual([]);
  });
  if (stock === '12x12' || stock === '12x20') {
    it('emits every cut sheet with vector glyphs and no SVG text elements', () => {
      for (const s of kit.sheets) expect(s.sheet.svg(s.title)).not.toMatch(/<(?:[\w-]+:)?text(?:\s|>)/i);
    });
    it('uses two 12x12 sheets or one 12x20 sheet, with less retained wood than before', () => {
      expect(kit.sheets).toHaveLength(sheetCounts[stock]);
      if (stock === '12x12') expect(kit.area.wood).toBeLessThan(72274.93 * 0.88);
    });
  }
  return () => kit;
}
