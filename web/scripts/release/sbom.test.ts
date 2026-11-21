import { readFileSync } from 'node:fs';
// Target selection for release:sbom: packages by workspace name, the site as the whole lockfile.
import { expect, it } from 'vitest';
import { repoRoot } from './git';
import { sbomArgs, sbomVersion } from './sbomTargets';

const root = repoRoot();
it('selects a package workspace for engine, archives and tools', () => {
  for (const id of ['engine', 'archives', 'tools']) {
    const args = sbomArgs(id, root)!;
    expect(args.slice(-2)).toEqual(['-w', `@lewismoten/gamemaker-sandbox-${id}`]);
    expect(args).toContain('--omit=dev');
    expect(args).toContain('cyclonedx');
  }
});
it('selects the whole lockfile for the site', () => {
  expect(sbomArgs('pages', root)).not.toContain('-w');
});
it('rejects an unknown target', () => {
  expect(sbomArgs('nope', root)).toBeUndefined();
});
it('takes the version from the argument or the manifest', () => {
  expect(sbomVersion('engine', root, '9.9.9')).toBe('9.9.9');
  expect(sbomVersion('engine', root)).toMatch(/^\d+\.\d+\.\d+/);
  expect(sbomVersion('pages', root)).toBe('next');
});

it('rejects inherited target names', () => {
  expect(sbomArgs('constructor', root)).toBeUndefined();
});

it('indexes the SBOM command and its release guide', () => {
  const index = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  expect(index).toMatch(/npm run release:sbom .*\(\.\.\/\.\.\/docs\/package-releases\.md\)/);
});
