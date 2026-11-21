// Select the release manifest and lockfile scope for npm sbom.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TARGETS } from './git';

export function sbomTarget(id: string, root: string) {
  if (!Object.hasOwn(TARGETS, id)) return undefined;
  const { manifest } = TARGETS[id];
  const pkg = JSON.parse(readFileSync(join(root, manifest ?? 'web/package.json'), 'utf8')) as { name: string; version: string };
  const name = manifest ? pkg.name : 'gamemaker-sandbox-edition';
  const version = pkg.version;
  const args = ['sbom', '--sbom-format', 'cyclonedx', '--package-lock-only', '--omit=dev'];
  if (manifest) args.push('-w', name);
  return {
    args,
    fileVersion: manifest ? version : 'next',
    component: { type: manifest ? 'library' : 'application', name, version, purl: `pkg:npm/${name.replace(/^@/, '%40')}@${encodeURIComponent(version)}` },
  };
}
