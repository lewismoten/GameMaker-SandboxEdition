// The declaration-freshness check: fresh, stale source, missing dist, and an upstream rebuild.
import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { staleDeclarations } from '../../scripts/decl-preflight.mjs';

const script = resolve(import.meta.dirname, '../../scripts/decl-preflight.mjs');
const dirs = [];
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

function setup(builtAt, srcAt, names = ['engine', 'archives']) {
  const root = mkdtempSync(join(tmpdir(), 'decl-'));
  dirs.push(root);
  for (const [i, n] of names.entries()) {
    const p = join(root, 'packages', n);
    mkdirSync(join(p, 'src'), { recursive: true });
    mkdirSync(join(p, 'dist/types'), { recursive: true });
    const src = join(p, 'src/a.ts');
    const stamp = join(p, 'dist/types/x.d.ts');
    writeFileSync(src, '');
    writeFileSync(stamp, '');
    utimesSync(src, srcAt[i], srcAt[i]);
    utimesSync(stamp, builtAt[i], builtAt[i]);
  }
  return root;
}

describe('staleDeclarations', () => {
  it('reports nothing when dist/types is newer than src', () => {
    expect(staleDeclarations(setup([200, 200], [100, 100]), ['engine', 'archives'])).toEqual([]);
  });
  it('reports a package whose source is newer, and the packages built after it', () => {
    const r = staleDeclarations(setup([200, 200], [300, 100]), ['engine', 'archives']);
    expect(r.map((s) => s.name)).toEqual(['engine', 'archives']);
    expect(r[0].reason).toMatch(/newer/);
  });
  it('reports only the later package when only it changed', () => {
    expect(staleDeclarations(setup([200, 200], [100, 300]), ['engine', 'archives']).map((s) => s.name)).toEqual(['archives']);
  });
  it('reports a missing dist/types', () => {
    const root = setup([200, 200], [100, 100]);
    rmSync(join(root, 'packages/engine/dist'), { recursive: true });
    const r = staleDeclarations(root, ['engine', 'archives']);
    expect(r[0]).toEqual({ name: 'engine', reason: 'dist/types is missing' });
  });
  it('ignores test files in src', () => {
    const root = setup([200], [100], ['engine']);
    const t = join(root, 'packages/engine/src/a.test.ts');
    writeFileSync(t, '');
    utimesSync(t, 900, 900);
    expect(staleDeclarations(root, ['engine'])).toEqual([]);
  });
});

describe('decl-preflight --web', () => {
  it('checks the tree it is given, not the checkout the script lives in', () => {
    const root = setup([100], [300], ['engine']); // stale: source newer than dist/types
    const run = (web) => spawnSync(process.execPath, [script, '--web', web], { encoding: 'utf8' });
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/engine: source is newer/);
    utimesSync(join(root, 'packages/engine/src/a.ts'), 50, 50); // now fresh; the other packages are missing, so only engine is judged
    expect(run(root).stderr).not.toMatch(/engine: source is newer/);
  });
});
