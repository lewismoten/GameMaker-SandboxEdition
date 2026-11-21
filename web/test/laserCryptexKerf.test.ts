// Check kerf compensation on packed kits made at the two supported extremes.
import { expect, it } from 'vitest';
import { buildCryptex } from '../../games/year2000/laser/cryptexBuild';
import { extent } from './cryptexStockCases';

it('applies kerf compensation once, independent of stock and nesting', () => {
  const a = buildCryptex(0, false);
  const b = buildCryptex(0.4, false);
  const width = (k: typeof a) => {
    const xs = extent(k.parts.A1.part.sheet.items[0]).map(([x]) => x);
    return Math.max(...xs) - Math.min(...xs);
  };
  expect(a.problems).toEqual([]);
  expect(b.problems).toEqual([]);
  expect(width(b) - width(a)).toBeCloseTo(0.4, 6);
}, 120000);
