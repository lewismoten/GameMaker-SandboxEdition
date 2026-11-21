// Packed cryptex regression for 12x20 inch stock.
import { describe } from 'vitest';
import { stockCases } from './cryptexStockCases';

describe('cryptex stock sheets', () => {
  stockCases('12x20');
});
