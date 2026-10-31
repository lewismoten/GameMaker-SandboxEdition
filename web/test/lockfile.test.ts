// The repository keeps one package-lock.json, at the root, and it covers every workspace.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');

describe('lockfile', () => {
  it('has no second package-lock.json', () => {
    const locks = tracked.filter((f) => f.split('/').pop() === 'package-lock.json');
    expect(locks).toEqual(['package-lock.json']);
  });

  it('lists every workspace of the root package.json', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { workspaces: string[] };
    const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
      packages: Record<string, unknown>;
    };
    const folders = new Set(tracked.filter((f) => f.endsWith('/package.json') || f === 'package.json').map(dirname));
    const found: string[] = [];
    for (const pattern of pkg.workspaces) {
      const re = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+')}$`);
      found.push(...[...folders].filter((d) => re.test(d)));
    }
    expect(found.length).toBeGreaterThanOrEqual(pkg.workspaces.length);
    for (const dir of found) expect(lock.packages, `${dir} is missing from package-lock.json`).toHaveProperty([dir]);
  });
});
