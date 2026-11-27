// Keep the title artwork's description in step with the Starter catalog.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { starterGroupOf } from '../../../web/src/project/starter';

it('names the current Pick It Up group in the title artwork description', () => {
  const [description] = readFileSync(new URL('./title.ts', import.meta.url), 'utf8').split('\n');
  expect(description).toContain(starterGroupOf('inventory'));
});
