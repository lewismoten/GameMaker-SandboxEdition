// Generated game outputs need a different development notice from source edits.
import { expect, it } from 'vitest';
import { isGameBuildOutput } from './devReload';

it.each([
  '/checkout/games/example/disk/TEST.GAM',
  '/checkout/games/example/walkPaths.json',
  '/checkout/games/.build-cache.json',
  '/checkout/web/public/trinkets/example/model.stl',
  'web/public/laser/example/part.svg',
  'C:\\checkout\\games\\example\\disk\\TEST.GAM',
])('recognizes generated output %s', (file) => expect(isGameBuildOutput(file)).toBe(true));

it.each([undefined, '', '/checkout/games/example/build.ts', '/checkout/web/src/main.ts', '/checkout/web/src/disk/example.ts'])(
  'keeps source and unknown changes as code notices: %s',
  (file) => expect(isGameBuildOutput(file)).toBe(false),
);
