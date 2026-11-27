// Keep the documented key budget in step with the neighborhood's three locks.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('documents where the three key units are spent', () => {
  const source = readFileSync(new URL('./ids.ts', import.meta.url), 'utf8');
  const comment = source.slice(source.lastIndexOf('/**', source.indexOf('keys: 21')), source.indexOf('keys: 21'));
  expect(comment).toMatch(/three[^]*garage[^]*lane[^]*car door/i);
});
