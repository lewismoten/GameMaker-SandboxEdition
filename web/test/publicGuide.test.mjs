// Check the protocol summary and the hosting instructions where a site author first needs them.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

function guide(name) {
  return readFileSync(new URL('../../docs/' + name, import.meta.url), 'utf8');
}

it('describes the catalog success reply alongside the imported-game reply', () => {
  const summary = guide('embed.md').split('**Read the answer.**')[1].split('Otherwise you get')[0];
  expect(summary).toContain('shareware');
  expect(summary).toMatch(/catalog copy/i);
});

it('explains how to list a mixed-case file on a case-sensitive host', () => {
  const instructions = guide('web-player.md').split('1. Copy each game')[1].split('2. Put')[0];
  expect(instructions).toContain('`gam`');
  expect(instructions).toContain('`files`');
  expect(instructions).toMatch(/exact spelling/i);
});
