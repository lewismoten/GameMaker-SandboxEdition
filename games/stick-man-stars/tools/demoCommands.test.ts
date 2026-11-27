// Keep the demo recording instructions pointed at this game's generator and disk builder.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('documents recording and rebuilding Stick Man Stars from web/', () => {
  const script = readFileSync(new URL('./gendemo.ts', import.meta.url), 'utf8');
  const paths = Array.from(script.matchAll(/npx vite-node (\S+)/g), ([, path]) => path);
  expect(paths).toEqual(['../games/stick-man-stars/tools/gendemo.ts', '../games/stick-man-stars/build.ts']);
});
