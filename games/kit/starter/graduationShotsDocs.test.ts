// The kit command reference gives authors the walkthrough sampling unit.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('documents the graduation screenshot interval in walkthrough frames', () => {
  const guide = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const entry = guide.split('\n').find((line) => line.includes('starter/graduationShots.ts'));
  expect(entry).toMatch(/walkEvery.*walkthrough frame/i);
});
