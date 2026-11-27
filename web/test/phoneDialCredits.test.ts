// Keep the printed phone dial's design credit in the repository notice.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('credits the rotary dial designer, source and license in the root notice', () => {
  const notice = readFileSync(new URL('../../NOTICE.md', import.meta.url), 'utf8');
  const credit = notice.split(/\n\s*\n/).find((paragraph) => paragraph.includes('thingiverse.com/thing:3153349'));
  expect(credit).toBeDefined();
  expect(credit).toContain('Rotary Dial mechanism');
  expect(credit).toContain('dAcid');
  expect(credit).toContain('CC BY 4.0');
});
