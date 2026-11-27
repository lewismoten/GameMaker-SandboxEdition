// Keep the route guide's upper ford crossing count in step with the level.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { FORD_AT } from '../src/levels/ford';

it('describes one upper ford crossing per reach', () => {
  const guide = readFileSync(new URL('./routeNew.ts', import.meta.url), 'utf8');
  expect(FORD_AT.upper.reaches).toHaveLength(5);
  expect(guide).toContain('upper ford, and five more');
});
