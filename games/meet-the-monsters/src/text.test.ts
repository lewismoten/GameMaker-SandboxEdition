// Check the ending against the monsters placed in both maps.
import { expect, it } from 'vitest';
import { buildLevels } from './levels';
import { WON } from './text';

it('greets every monster placed across the two levels', () => {
  const count = buildLevels().levels.flatMap(({ map }) => map.map.monsters.filter(({ monnum }) => monnum < 64)).length;
  expect(WON.replace(/\s+/g, ' ')).toContain(`Two levels, ${count} monsters, and every one said hi.`);
});
