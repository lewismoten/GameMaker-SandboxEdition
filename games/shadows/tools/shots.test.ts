// Keep the room-view command discoverable in the shot tool's usage.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('gives authors the separate command for room views', () => {
  const usage = readFileSync(new URL('./shots.ts', import.meta.url), 'utf8').split('import ')[0];
  expect(usage).toMatch(/npx vite-node \.\.\/games\/shadows\/tools\/preview\.ts <outDir>/);
});
