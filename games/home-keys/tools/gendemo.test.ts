// Keep the recorder's instructions consistent with the Home Keys lessons.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('describes the star throw and the optional shelf leaps', () => {
  const header = readFileSync(new URL('./gendemo.ts', import.meta.url), 'utf8').split('import {')[0];
  expect(header).toMatch(/Enter[^.]*star/i);
  expect(header).toMatch(/Q and E[^.]*shelves/i);
});
