// Exercise the verifier's Git selection while recording its check commands.
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';

let root: string;
function write(path: string, content: string) {
  const file = join(root, path);
  mkdirSync(resolve(file, '..'), { recursive: true });
  writeFileSync(file, content);
}
function git(...args: string[]) {
  execFileSync('git', args, { cwd: root });
}
function verify(base = 'HEAD') {
  return execFileSync(process.execPath, ['scripts/verify-changed.mjs', '--base', base], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PATH: join(root, 'bin') + ':' + process.env.PATH },
  });
}
beforeEach(() => {
  const scratch = resolve('../.tmp');
  mkdirSync(scratch, { recursive: true });
  root = mkdtempSync(join(scratch, 'verify-'));
  mkdirSync(join(root, 'scripts'));
  copyFileSync('../scripts/verify-changed.mjs', join(root, 'scripts/verify-changed.mjs'));
  mkdirSync(join(root, 'web/test'), { recursive: true });
  for (const cmd of ['npm', 'npx']) {
    write('bin/' + cmd, '#!/bin/sh\nexit 0\n');
    chmodSync(join(root, 'bin', cmd), 0o755);
  }
  git('init', '-q');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));
function baseline() {
  git('add', '.');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture');
}
it('runs the desk README reader for a README-only change', () => {
  const reader = 'src/manual/magazine/sections/spring93/hintLineFacts.test.ts';
  write('web/src/desk/README.md', 'original');
  write('web/' + reader, readFileSync(reader, 'utf8'));
  write('web/test/unrelated.test.ts', "readFileSync('src/other/README.md')");
  baseline();
  write('web/src/desk/README.md', 'changed');
  const output = verify();
  expect(output).toContain(reader);
  expect(output).not.toContain('unrelated.test.ts');
});

it.each([
  ['web/packages/tools/src/unused.ts', 'release:check: npm run release:check'],
  ['games/sample/src/unused.ts', 'check:games -- --game sample --quick'],
])('classifies deletion of %s without formatting or linting it', (path, expected) => {
  write(path, '');
  baseline();
  git('rm', path);
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'delete fixture');
  const output = verify('HEAD^');
  expect(output).toContain(expected);
  expect(output).toMatch(/prettier\s+skip/);
  expect(output).toMatch(/eslint\s+skip/);
});
