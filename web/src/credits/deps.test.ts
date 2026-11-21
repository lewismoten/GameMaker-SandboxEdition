// deps.json is the package list the Credits page shows: it must match package-lock.json.
// When this fails, run `npx vite-node scripts/credits.ts` from web/ and commit deps.json.
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { depsFromLock, type DepsFile, type Lockfile } from './lockDeps';
import { DEP_NOTES } from './depNotes';
import file from './deps.json';

const web = join(import.meta.dirname, '../..');
const lock = JSON.parse(readFileSync(join(web, '../package-lock.json'), 'utf8')) as Lockfile;
const saved: DepsFile = file;

describe('credits: deps.json', () => {
  it('follows workspace links and hoisted dependencies without crediting the app itself', () => {
    const workspace: Lockfile = {
      packages: {
        '': { devDependencies: { unrelated: '1.0.0' } },
        web: { dependencies: { engine: '3.2.0' }, devDependencies: { compiler: '1.0.0' } },
        'web/packages/engine': { version: '3.2.0', license: 'MIT', dependencies: { codec: '2.0.0' } },
        'node_modules/app': { link: true, resolved: 'web' },
        'node_modules/engine': { link: true, resolved: 'web/packages/engine' },
        'node_modules/codec': { version: '2.0.0', license: 'MIT' },
        'node_modules/compiler': { version: '1.0.0', license: 'Apache-2.0', dev: true },
      },
    };
    expect(depsFromLock(workspace).deps).toEqual([
      { name: 'codec', version: '2.0.0', license: 'MIT', direct: false, runtime: true, usedBy: ['engine'] },
      { name: 'compiler', version: '1.0.0', license: 'Apache-2.0', direct: true, runtime: false, usedBy: [] },
      { name: 'engine', version: '3.2.0', license: 'MIT', direct: true, runtime: true, usedBy: [] },
    ]);
  });

  it('lists every package in package-lock.json, with its version, license and users', () => {
    const fresh = depsFromLock(lock);
    const strip = saved.deps.map(({ author: _a, repo: _r, ...d }) => d);
    expect(strip).toEqual(fresh.deps);
    expect(saved.platformBuilds).toEqual(fresh.platformBuilds);
  });

  it('says what each of web/package.json’s own packages is for', () => {
    for (const d of saved.deps.filter((d) => d.direct)) expect(DEP_NOTES[d.name], d.name).toBeTruthy();
  });
});

it('includes the authors and repositories shown on the Credits page', () => {
  expect(saved.deps.filter((d) => d.author).length).toBeGreaterThan(saved.deps.length / 2);
  expect(saved.deps.filter((d) => d.repo).length).toBeGreaterThan(saved.deps.length * 0.9);
});
it('preserves the generated JSON format', () => {
  expect(readFileSync(join(web, 'src/credits/deps.json'), 'utf8')).toBe(JSON.stringify(saved, null, 2) + '\n');
});

it('refuses to overwrite credits if an installed manifest is missing', async () => {
  const write = vi.fn();
  vi.doMock('node:fs', async (importOriginal) => ({ ...(await importOriginal<typeof import('node:fs')>()), existsSync: () => false, writeFileSync: write }));
  try {
    await expect(import('../../scripts/credits')).rejects.toThrow(/Run npm ci first/);
    expect(write).not.toHaveBeenCalled();
  } finally {
    vi.doUnmock('node:fs');
  }
});
