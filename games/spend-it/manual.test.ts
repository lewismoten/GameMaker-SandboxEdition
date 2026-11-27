// Check the Save Up editing exercise for the regular route through level one.
import { expect, it } from 'vitest';
import manual from './manual.json';

it('accounts for the carried coin when making the five-coin key unaffordable', () => {
  const exercise = manual.pages.find((page) => page.html.includes('Make it yours'))?.html;
  expect(exercise).toMatch(/remove two coins/i);
  expect(exercise).toMatch(/one coin left from level 1/i);
});
