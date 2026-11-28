// Regression for filtered dialog audit columns.
import { expect, it } from 'vitest';
import { formatSummary } from './dialogsFitSummary';

it('prints a dark-only failure under its selected viewport', () => {
  const table = formatSummary(['dark'], ['360x740'], new Map([['sample', { cells: ['FAIL'], notes: [] }]]));
  expect(table.split('\n').map((line) => line.trim().split(/\s*\|\s*/))).toEqual([
    ['dialog', 'dark 360x740'],
    ['sample', 'FAIL'],
  ]);
});
