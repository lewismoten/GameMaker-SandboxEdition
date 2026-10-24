// deps.json is the package list the Credits page shows: it must match package-lock.json.
// When this fails, run `npx vite-node scripts/credits.ts` from web/ and commit deps.json.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { depsFromLock, type DepsFile, type Lockfile } from './lockDeps';
import { DEP_NOTES } from './depNotes';
import file from './deps.json';

const web = join(import.meta.dirname, '../..');
const lock = JSON.parse(readFileSync(join(web, 'package-lock.json'), 'utf8')) as Lockfile;
const saved = file as DepsFile;

describe('credits: deps.json', () => {
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
