// Material estimates for every stock.
import { expect, it } from 'vitest';
import { STOCK, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { fittingTable } from '../../games/year2000/laser/cryptexBuild';
import { sheetCounts } from './cryptexStockCases';

it('matches the fitting table to the packed sheet counts and areas', () => {
  const rows = fittingTable();
  for (const stock of Object.keys(STOCK) as StockSize[]) {
    const fit = rows.find((f) => f.stock === stock)!;
    expect(fit.sheets).toBe(sheetCounts[stock]);
    expect(fit.materialMm2).toBeCloseTo(sheetCounts[stock] * STOCK[stock].w * STOCK[stock].h, 6);
    expect(fit.materialIn2).toBeCloseTo(fit.sheets * Number(stock.split('x')[0]) * Number(stock.split('x')[1]), 6);
    expect(fit.label).toContain(`of ${stock}`);
  }
}, 60000);
