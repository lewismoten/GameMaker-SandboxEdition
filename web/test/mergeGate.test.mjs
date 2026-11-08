// Integration mechanics use real disposable Git repos; expensive checks use recorded-shape results.
import { existsSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { gateOptions, runGate } from '../../scripts/merge-gate.mjs';
import { git } from '../../scripts/repo-command.mjs';
import { change, fakeChecks, fixture } from './repoWorkflowFixtures.mjs';

const fixtures = [];
afterEach(() => {
  for (const f of fixtures.splice(0)) rmSync(f.dir, { recursive: true, force: true });
});
function setup() {
  const f = fixture();
  fixtures.push(f);
  return f;
}
function run(f, options = {}, execute = fakeChecks()) {
  return runGate({ branches: ['feature/task'], games: [], push: false, ...options }, { ...f, cwd: f.root, execute });
}

describe('merge gate', () => {
  it('rejects ambiguous arguments and requires an explicit push flag', () => {
    expect(gateOptions(['feature/a', '--games', 'one,two']).push).toBe(false);
    expect(() => gateOptions(['--games', '../escape'])).toThrow();
    expect(() => gateOptions(['develop'])).toThrow();
  });

  it('pins inputs, runs disks before tests, and pushes exactly the tested SHA to a local remote', () => {
    const f = setup();
    const revision = change(f.root, 'feature/task', 'new.txt', 'feature\n');
    const result = run(f, { push: true, games: ['sample'] });
    expect(result.exitCode).toBe(0);
    expect(result.inputs[0].revision).toBe(revision);
    expect(git(f.root, 'ls-remote', 'origin', 'refs/heads/develop').split(/\s/)[0]).toBe(result.testedRevision);
    expect(result.pushedRevision).toBe(result.testedRevision);
    expect(result.steps.map((s) => s.name)).toEqual(['packages', 'disks', 'levelViews', 'declarations', 'tsc', 'lint', 'vitest', 'game-sample', 'push']);
    expect(JSON.parse(readFileSync(join(f.output, 'result.json'))).candidateTree).toBe(git(f.integration, 'rev-parse', 'HEAD^{tree}'));
    expect(existsSync(`${f.integration}.gate-lock`)).toBe(false);
  });

  it('never pushes a failed test or falls through to game checks', () => {
    const f = setup();
    const before = git(f.root, 'rev-parse', 'origin/develop');
    change(f.root, 'feature/task', 'new.txt', 'feature\n');
    const result = run(f, { push: true, games: ['sample'] }, fakeChecks(true));
    expect(result.exitCode).toBe(4);
    expect(result.tests.failures[0].allowed).toBe(false);
    expect(result.steps.at(-1).name).toBe('vitest');
    expect(git(f.root, 'rev-parse', 'origin/develop')).toBe(before);
  });

  it('propagates a build failure before running tsc or tests', () => {
    const f = setup();
    change(f.root, 'feature/task', 'new.txt', 'feature\n');
    const result = run(f, { push: true }, () => ({ code: 9, stdout: '', stderr: 'build failed' }));
    expect(result.exitCode).toBe(4);
    expect(result.steps.map((s) => s.code)).toEqual([9]);
    expect(result.pushedRevision).toBeUndefined();
  });

  it('aborts code conflicts and keeps the last clean candidate', () => {
    const f = setup();
    change(f.root, 'feature/task', 'code.js', '// feature\n');
    change(f.root, 'develop', 'code.js', '// develop\n');
    const result = run(f);
    expect(result.exitCode).toBe(3);
    expect(result.error).toMatch(/Code conflict/);
    expect(git(f.integration, 'status', '--porcelain')).toBe('');
    expect(readFileSync(join(f.integration, 'code.js'), 'utf8')).toBe('// develop\n');
  });

  it('unions approved text conflicts but rejects invalid JSON unions', () => {
    const f = setup();
    change(f.root, 'feature/task', 'notes.txt', 'feature\n');
    change(f.root, 'develop', 'notes.txt', 'develop\n');
    const result = run(f);
    expect(result.exitCode).toBe(0);
    expect(result.inputs[0].union).toEqual(['notes.txt']);
    expect(readFileSync(join(f.integration, 'notes.txt'), 'utf8')).toBe('develop\nfeature\n');
    change(f.root, 'develop', 'data.json', '{"value":0}\n');
    change(f.root, 'feature/json', 'data.json', '{"value":1}\n');
    change(f.root, 'develop', 'data.json', '{"value":2}\n');
    const bad = run(f, { branches: ['feature/json'] });
    expect(bad.exitCode, bad.error).toBe(3);
    expect(bad.error).toMatch(/JSON/);
    expect(bad.steps).toEqual([]);
    expect(git(f.integration, 'status', '--porcelain')).toBe('');
    expect(readFileSync(join(f.integration, 'data.json'), 'utf8')).toBe('{"value":2}\n');
  });

  it('reuses a clean detached integration worktree through a symlink alias', () => {
    const f = setup();
    change(f.root, 'feature/task', 'new.txt', 'feature\n');
    const first = run(f);
    expect(first.exitCode, first.error).toBe(0);
    const alias = join(f.dir, 'merge-alias');
    symlinkSync(f.integration, alias, 'dir');
    f.integration = alias;
    const second = run(f);
    expect(second.exitCode, second.error).toBe(0);
  });

  it('refuses candidate drift and a remote that advances during testing', () => {
    const f = setup();
    change(f.root, 'feature/task', 'new.txt', 'feature\n');
    const dirty = run(
      f,
      { push: true },
      fakeChecks(false, (cwd, argv) => {
        if (argv.includes('vitest')) writeFileSync(join(cwd, '..', 'notes.txt'), 'changed during tests\n');
      }),
    );
    expect(dirty.exitCode).toBe(4);
    expect(dirty.pushedRevision).toBeUndefined();
    // A dirty integration worktree is preserved, never reset by the next invocation.
    expect(run(f).exitCode).toBe(2);
    expect(readFileSync(join(f.integration, 'notes.txt'), 'utf8')).toBe('changed during tests\n');
    const second = setup();
    change(second.root, 'feature/task', 'new.txt', 'feature\n');
    const advanced = run(
      second,
      { push: true },
      fakeChecks(false, (_cwd, argv) => {
        if (argv.includes('vitest')) change(second.root, 'develop', 'remote.txt', 'new base\n');
      }),
    );
    expect(advanced.exitCode).toBe(5);
    expect(advanced.error).toMatch(/advanced/);
  });
});
