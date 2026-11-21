// Packed cryptex regression for 6x12 inch stock.
import { describe } from 'vitest';
import { stockCases } from './cryptexStockCases';

describe('cryptex stock sheets', () => {
  stockCases('6x12');
});
