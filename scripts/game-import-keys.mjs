// Per-game cache keys: a game's disk depends on the files its build.ts really imports (found with an
// esbuild metafile, same 'gamemaker-source' condition vite-node uses), the data files beside them
// (its own folder, non-TypeScript files in games/kit and the packages), the stock player and the lockfile.
// Editing something under web/src that no game imports (a page, the desk, the editor) leaves every key alone.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join, relative } from 'node:path';
import { build } from 'esbuild';
import { gameSourceHash, root } from './game-build-inputs.mjs';
const skip = new Set(['disk', 'walkPaths.json', '.build-cache.json', '.render-cache', '.DS_Store', '__pycache__', 'node_modules']);
const packages = ['engine', 'tools', 'archives'].map((p) => join(root, 'web/packages', p));
const rel = (file) => relative(root, file).replaceAll('\\', '/');
function walk(dir, keep, out = []) {
  if (!existsSync(dir)) return out;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(item.name)) continue;
    const file = join(dir, item.name);
    if (item.isDirectory()) walk(file, keep, out);
    else if (item.isFile() && keep(item.name)) out.push(file);
  }
  return out;
}
const notDoc = (name) => !name.endsWith('.md');
const notCode = (name) => notDoc(name) && !/\.(ts|mts)$/.test(name);
const shared = [
  ...walk(join(root, 'games/kit'), notCode),
  ...packages.flatMap((p) => [...walk(join(p, 'src'), notCode), join(p, 'package.json'), join(p, 'tsconfig.json')]),
  ...['package.json', 'web/package.json', 'web/tsconfig.json', 'web/vite.config.ts'].map((file) => join(root, file)),
  join(root, 'cd/gm/xferplay.exe'),
  join(root, 'package-lock.json'),
].filter(existsSync);

/** The source files a game's build.ts imports (real paths, node_modules left out). */
export async function importedFiles(id) {
  const result = await build({
    entryPoints: [join(root, 'games', id, 'build.ts')],
    bundle: true,
    write: false,
    metafile: true,
    platform: 'node',
    format: 'esm',
    external: ['node:*'],
    logLevel: 'silent',
    absWorkingDir: join(root, 'web'),
    conditions: ['gamemaker-source', 'module', 'node'],
  });
  return Object.keys(result.metafile.inputs)
    .map((file) => realpathSync(join(root, 'web', file)))
    .filter((file) => !file.includes('/node_modules/'));
}

/** {id: sha256} for every game id given. */
export async function gameKeys(ids) {
  const frames = gameSourceHash(true);
  const entries = await Promise.all(
    ids.map(async (id) => {
      const files = new Set([...(await importedFiles(id)), ...walk(join(root, 'games', id), notDoc), ...shared]);
      const hash = createHash('sha256');
      for (const file of [...files].sort()) hash.update(rel(file)).update('\0').update(readFileSync(file)).update('\0');
      if (id === 'depth') hash.update(frames);
      return [id, hash.digest('hex')];
    }),
  );
  return Object.fromEntries(entries);
}
