// Packed cryptex regression for 8x12 inch stock.
import { describe } from 'vitest';
import { stockCases } from './cryptexStockCases';

describe('cryptex stock sheets', () => {
  stockCases('8x12');
});
