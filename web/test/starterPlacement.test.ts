// Keep the contributor placement rule consistent with the Starter learning links.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('includes Guide and editor entry points in the Starter placement rule', () => {
  const instructions = readFileSync(new URL('../../AGENTS.md', import.meta.url), 'utf8');
  const rule = instructions.match(/^- \*\*Starters\*\*[^\n]*(?:\n {2}[^\n]*)*/m)?.[0];
  expect(rule).toMatch(/\bGuide\b/);
  expect(rule).toMatch(/\beditor\b/i);
});
