// The storm changes the water itself, even when the two scenes share every tile.
import { expect, it } from 'vitest';
import { buildLevels } from '../src/levels';
import { assertDarkerPuddle } from './puddlePalette';

it('requires darker water in the middle of the puddle', () => {
  const { pal, levels, storm } = buildLevels();
  const water = levels[1].book.pics.get('pool1.0')!.get(10, 7);
  const unrelated = pal.pal.slice();
  unrelated[0] ^= 1;
  expect(() => assertDarkerPuddle(pal.pal, unrelated, water)).toThrow();
  expect(() => assertDarkerPuddle(pal.pal, storm, water)).not.toThrow();
});
