// The editor describes the same counter and gate price as the hill.
import { expect, it } from 'vitest';
import controls from '../controls.json';
import { KEYS } from '../../kit/starter/blocks';
import { GATE_STARS } from '../src/pickStar';

it('describes the picked stars and the cost of the town gate', () => {
  const label = controls.counters[KEYS];
  expect(label).toMatch(/picked stars/i);
  expect(label).toContain(String(GATE_STARS));
  expect(label).toMatch(/town gate/i);
});
