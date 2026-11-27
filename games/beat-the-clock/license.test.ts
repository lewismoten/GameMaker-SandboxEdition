// Check the license players receive on the generated disk.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { TITLE } from './src/game';

it('names Beat the Clock in the disk license heading', () => {
  const license = readFileSync(new URL('./disk/license.txt', import.meta.url), 'utf8');
  expect(license.split(/\r?\n/)[2]).toBe(TITLE);
});
