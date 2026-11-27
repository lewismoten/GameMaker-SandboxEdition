// Check the host test launcher without compiling or writing a Courier build.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const cwd = fileURLToPath(new URL('../../hardware/courier/', import.meta.url));

it.each([undefined, resolve(cwd, 'custom-build')])('launches the compiled Courier test with BUILD=%s', (build) => {
  const executable = (build ?? '.build') + '/test_courier';
  const recipe = execFileSync('make', ['-n', '-o', executable, ...(build ? ['BUILD=' + build] : []), 'test'], { cwd, encoding: 'utf8' });
  expect(resolve(cwd, recipe.trim())).toBe(resolve(cwd, executable));
});
