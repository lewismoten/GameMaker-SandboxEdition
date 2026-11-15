// Target selection for release:sbom: the `npm sbom` arguments and the version for the file name.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TARGETS } from './git';

/** The `npm sbom` arguments for a target: a package by workspace name, the site as the whole lockfile. */
export function sbomArgs(name: string, root: string): string[] | undefined {
  const t = TARGETS[name];
  if (!t) return undefined;
  const base = ['sbom', '--sbom-format', 'cyclonedx', '--package-lock-only', '--omit=dev'];
  if (!t.manifest) return base;
  const pkgName = (JSON.parse(readFileSync(join(root, t.manifest), 'utf8')) as { name: string }).name;
  return [...base, '-w', pkgName];
}

/** The version for the file name: the argument, else the package's manifest version, else "next" (the site). */
export function sbomVersion(name: string, root: string, given?: string): string {
  if (given) return given;
  const t = TARGETS[name];
  if (t?.manifest) return (JSON.parse(readFileSync(join(root, t.manifest), 'utf8')) as { version: string }).version;
  return 'next';
}
