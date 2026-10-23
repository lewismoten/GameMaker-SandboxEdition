// Writes src/credits/deps.json, the package list on the Credits page (#/credits): every npm
// package in package-lock.json, with its version and license from the lockfile, its author
// and repository from node_modules/<name>/package.json, and which of web/package.json's own
// packages pull it in. src/credits/deps.test.ts fails when the JSON is behind the lockfile.
//
//   npx vite-node scripts/credits.ts      (from web/, after npm install)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { depsFromLock, nameOf, type DepsFile, type Lockfile } from '../src/credits/lockDeps';

interface Manifest {
  author?: string | { name?: string };
  contributors?: (string | { name?: string })[];
  repository?: string | { url?: string };
}

const person = (p: string | { name?: string } | undefined) => (typeof p === 'string' ? p.replace(/\s*[<(].*$/, '').trim() : p?.name);

/** A repository field as a web address. */
export function repoUrl(r: Manifest['repository']): string | undefined {
  const raw = typeof r === 'string' ? r : r?.url;
  if (!raw) return undefined;
  const short = /^(?:github:)?([\w.-]+\/[\w.-]+)$/.exec(raw);
  if (short) return `https://github.com/${short[1]}`;
  return raw
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@([^:]+):/, 'https://$1/')
    .replace(/\.git$/, '');
}

function main(): void {
  const web = resolve(import.meta.dirname, '..');
  const lock = JSON.parse(readFileSync(join(web, 'package-lock.json'), 'utf8')) as Lockfile;
  const { deps, platformBuilds } = depsFromLock(lock);
  // author and repository: from the installed package (the lockfile has neither)
  const paths = new Map(Object.keys(lock.packages).map((path) => [`${nameOf(path)}@${lock.packages[path].version}`, path]));
  for (const d of deps) {
    const file = join(web, paths.get(`${d.name}@${d.version}`)!, 'package.json');
    if (!existsSync(file)) continue;
    const m = JSON.parse(readFileSync(file, 'utf8')) as Manifest;
    const author = person(m.author) ?? person(m.contributors?.[0]);
    if (author) d.author = author;
    const repo = repoUrl(m.repository);
    if (repo) d.repo = repo;
  }
  const out: DepsFile = {
    note: 'Written by web/scripts/credits.ts from package-lock.json and node_modules; do not edit by hand.',
    deps,
    platformBuilds,
  };
  writeFileSync(join(web, 'src/credits/deps.json'), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`src/credits/deps.json: ${deps.length} packages, ${platformBuilds.length} platform builds`);
}

main();
