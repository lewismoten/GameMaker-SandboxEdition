import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import web from '../../package.json';
import archives from '../../packages/archives/package.json';
// Target selection for release:sbom: packages by workspace name, the site as the whole lockfile.
import { expect, it } from 'vitest';
import { repoRoot } from './git';
import { sbomTarget } from './sbomTargets';

const root = repoRoot();
it('selects a package workspace for engine, archives and tools', () => {
  for (const id of ['engine', 'archives', 'tools']) {
    const args = sbomTarget(id, root)!.args;
    expect(args.slice(-2)).toEqual(['-w', `@lewismoten/gamemaker-sandbox-${id}`]);
    expect(args).toContain('--omit=dev');
    expect(args).toContain('cyclonedx');
  }
});
it('selects the whole lockfile for the site', () => {
  expect(sbomTarget('pages', root)!.args).not.toContain('-w');
});
it('rejects an unknown target', () => {
  expect(sbomTarget('nope', root)).toBeUndefined();
});
it('uses the web manifest version and site identity for pages', () => {
  expect(sbomTarget('pages', root)).toMatchObject({
    fileVersion: 'next',
    component: { name: 'gamemaker-sandbox-edition', version: web.version, purl: `pkg:npm/gamemaker-sandbox-edition@${web.version}` },
  });
});

it.each(['--unknown', '--out'])('prints usage and exits 1 for %s', (flag) => {
  const result = spawnSync(join(root, 'node_modules/.bin/vite-node'), ['scripts/release/sbom.ts', 'archives', flag], {
    cwd: join(root, 'web'),
    encoding: 'utf8',
  });
  expect(result.status).toBe(1);
  expect(result.stderr.trim()).toBe('Usage: npm run release:sbom -- <pages|engine|archives|tools> [version] [--out file]');
});

it('writes real offline npm components and warns when the requested version differs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sbom-'));
  try {
    const result = spawnSync(join(root, 'node_modules/.bin/vite-node'), ['scripts/release/sbom.ts', 'archives', '99.0.0', '--out=inventory.json'], {
      cwd: join(root, 'web'),
      env: { ...process.env, INIT_CWD: dir, npm_config_offline: 'true' },
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toContain(`requested version 99.0.0 differs from archives manifest version ${archives.version}`);
    const bom = JSON.parse(readFileSync(join(dir, 'inventory.json'), 'utf8')) as {
      metadata: { component: unknown };
      components: { name: string }[];
    };
    expect(bom.metadata.component).toMatchObject({
      name: archives.name,
      version: archives.version,
      purl: `pkg:npm/%40lewismoten/gamemaker-sandbox-archives@${archives.version}`,
    });
    expect(bom.components.map((c) => c.name)).toEqual(expect.arrayContaining(['archives', 'engine']));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('rejects inherited target names', () => {
  expect(sbomTarget('constructor', root)).toBeUndefined();
});

it('indexes the SBOM command and its release guide', () => {
  const index = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  expect(index).toMatch(/npm run release:sbom .*\(\.\.\/\.\.\/docs\/package-releases\.md\)/);
});
