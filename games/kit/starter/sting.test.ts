// Keep the Starter opening's drop-rate comment tied to its timing constant.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('describes the drop group size using PER_FRAME', () => {
  const source = readFileSync(new URL('./sting.ts', import.meta.url), 'utf8');
  const comment = source.match(/\/\*\* ([^*]*) \*\/\s*const PER_FRAME\b/)?.[1];
  expect(comment).toMatch(/\bPER_FRAME\b/);
});
