// Declaration-freshness preflight: tsc and type-aware lint read each SDK package's dist/types,
// while vitest and vite read src. Compares the newest source mtime of each package with its
// newest dist/types/*.d.ts and fails (or, with --fix, rebuilds only the stale packages, in order).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const PACKAGES = ['engine', 'archives', 'tools']; // build order: each depends on the ones before it

function newestMtime(dir, keep = (n) => !/\.test\.tsx?$/.test(n)) {
  let newest = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) newest = Math.max(newest, newestMtime(p, keep));
    else if (keep(e.name)) newest = Math.max(newest, statSync(p).mtimeMs);
  }
  return newest;
}

/** Returns [{ name, reason }] for each package whose declarations are missing or older than its inputs. */
export function staleDeclarations(webRoot, packages = PACKAGES) {
  const stale = [];
  let upstream = false; // a stale package makes the ones built after it stale too
  for (const name of packages) {
    const dir = join(webRoot, 'packages', name);
    const types = join(dir, 'dist/types');
    let reason = '';
    const built = existsSync(types) ? newestMtime(types, (n) => n.endsWith('.d.ts')) : 0;
    if (!built) reason = 'dist/types is missing';
    else {
      let input = newestMtime(join(dir, 'src'));
      for (const f of ['package.json', 'tsconfig.json']) if (existsSync(join(dir, f))) input = Math.max(input, statSync(join(dir, f)).mtimeMs);
      if (input > built) reason = 'source is newer than dist/types';
      else if (upstream) reason = 'an earlier package was rebuilt';
    }
    if (reason) {
      stale.push({ name, reason });
      upstream = true;
    }
  }
  return stale;
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const stale = staleDeclarations(join(root, 'web'));
  if (!stale.length) return 0;
  if (process.argv.includes('--fix')) {
    for (const { name } of stale) {
      console.error(`decl-preflight: rebuilding ${name}`);
      const r = spawnSync('npm', ['run', 'build', '-w', `@lewismoten/gamemaker-sandbox-${name}`], { cwd: root, stdio: 'inherit' });
      if (r.status) return r.status;
    }
    return 0;
  }
  console.error(
    'decl-preflight: stale package declarations (tsc and type-aware lint read dist/types, vitest reads src):\n' +
      stale.map((s) => `  ${s.name}: ${s.reason}`).join('\n') +
      '\nRun `npm run build:packages` from the repository root (or `node scripts/decl-preflight.mjs --fix` to rebuild only these).',
  );
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main());
