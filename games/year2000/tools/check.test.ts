// Keep the recovery check's description clear about where its fresh character starts.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('identifies the direct Science Fair start in the recovery check and its output', () => {
  const source = readFileSync(new URL('./check.ts', import.meta.url), 'utf8');
  const fixture = source.slice(source.lastIndexOf('/**', source.indexOf('async function shortOfPages')), source.indexOf('async function spareCover'));
  expect(fixture.split('async function shortOfPages')[0]).toMatch(/fresh character directly at the Science Fair/i);
  expect(fixture).toContain('short of pages: started directly at the fair with 0 pages');
});
