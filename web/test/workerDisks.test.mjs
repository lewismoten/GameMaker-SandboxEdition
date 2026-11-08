// Copy isolation and symlink refusal without dependency installation, network or hardware access.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { assertPrivateDisks, cloneDisks } from '../../scripts/worker-disks.mjs';

const dirs = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'worker-disks-'));
  dirs.push(dir);
  const source = join(dir, 'source');
  const target = join(dir, 'target');
  mkdirSync(join(source, 'games/sample/disk'), { recursive: true });
  mkdirSync(join(target, 'games/sample'), { recursive: true });
  writeFileSync(join(source, 'games/sample/disk/data'), 'source');
  writeFileSync(join(source, 'games/sample/walkPaths.json'), '{}');
  return { source, target };
}

describe('private worker outputs', () => {
  it('clones private outputs whose later writes cannot affect the source', () => {
    const { source, target } = setup();
    expect(cloneDisks(source, target)).toEqual(['sample/disk', 'sample/walkPaths.json']);
    writeFileSync(join(target, 'games/sample/disk/data'), 'worker');
    expect(readFileSync(join(source, 'games/sample/disk/data'), 'utf8')).toBe('source');
    expect(() => cloneDisks(source, target)).toThrow(/already exists/);
  });
  it('rejects source and target disk symlinks, including dangling and nested links', () => {
    const { source, target } = setup();
    symlinkSync(join(source, 'games/sample/disk'), join(target, 'games/sample/disk'));
    expect(() => assertPrivateDisks(target)).toThrow(/symlink/);
    expect(() => cloneDisks(source, target)).toThrow(/symlink/);
    symlinkSync('/missing-output', join(source, 'games/sample/disk/bad'));
    expect(() => assertPrivateDisks(source)).toThrow(/symlink/);
  });
});
