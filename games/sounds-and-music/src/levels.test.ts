// Keep the level definitions in a single source file.
import { readdirSync } from 'node:fs';
import { expect, it } from 'vitest';

it('has one levels.ts source without backup copies', () => {
  const files = readdirSync(new URL('.', import.meta.url));
  expect(files.filter((name) => name.startsWith('levels.ts'))).toEqual(['levels.ts']);
});
