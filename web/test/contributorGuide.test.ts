// Keep the contributor checklist explicit about root verification and game checks.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('lists the root checks and gives changed games their own command', () => {
  const guide = readFileSync(new URL('../../CONTRIBUTING.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');
  const checks = guide.split('`npm run verify`')[1]?.split('.')[0];
  for (const check of ['formatting', 'lint', 'type', 'test', 'package', 'release']) {
    expect(checks).toContain(check);
  }
  expect(guide).toContain('`npm run check:games -- --game <id>`');
});
