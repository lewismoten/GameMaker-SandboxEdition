// Check the figure output path from the guide's command working directory.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { OUT } from './artCourseKit';

it('documents the Course 1 figure output relative to web/', () => {
  const guide = readFileSync(new URL('./README.md', import.meta.url), 'utf8');
  const entry = guide.split('\n').find((line) => line.startsWith('- `artCourseFigures.ts`'));
  const glob = entry?.match(/`([^`]+\/\*\.png)`/)?.[1];
  expect(glob).toBeDefined();
  const web = fileURLToPath(new URL('../', import.meta.url));
  expect(resolve(web, dirname(glob!))).toBe(resolve(OUT));
});
