// The fifteen-level release added three levels to the 3.x parade.
import { expect, it } from 'vitest';
import about from './about.json';

it('gives the expanded parade a major version above 3', () => {
  expect(Number(about.version.split('.')[0])).toBeGreaterThan(3);
});
