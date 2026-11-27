// Check the maintenance regression directly because both expressions produce identical rows.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('uses the jump clearance directly as the minimum platform row', () => {
  const source = readFileSync(new URL('../packages/tools/src/kit/levelGen/platform.ts', import.meta.url), 'utf8');
  expect(source.match(/const rowMin = (.*);/)?.[1]).toBe('Math.ceil(o.physics.rise / BLEN) + 3');
});
