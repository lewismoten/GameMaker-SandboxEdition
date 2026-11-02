// Bundles a game build entry with esbuild so a build child runs under plain `node` instead of vite-node.
// vite-node costs every child about 1.7 s to start and turns each imported name into a getter call on every use
// (about 10% of the instructions of a Depth frame shard); one esbuild bundle avoids both. Resolution matches
// game-build.config.mjs: the 'gamemaker-source' condition, workspace packages bundled, other packages left to node.
// `import.meta.url` / `dirname` / `filename` are rewritten per source file, so code that reads files beside itself
// still finds them. A bundle that cannot be made (or later fails) makes build-games.mjs fall back to vite-node.
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { root } from './game-build-inputs.mjs';

const dir = join(root, 'node_modules/.cache/game-bundles', String(process.pid));
const made = new Map();
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));

/** Rewrites import.meta.url, dirname and filename to the original source file's values. */
const sourceMeta = {
  name: 'source-meta',
  setup(b) {
    b.onResolve({ filter: /^[^./]/ }, (args) => {
      if (args.path.startsWith('@lewismoten/') || args.path.startsWith('/') || /^[a-zA-Z]:/.test(args.path)) return undefined;
      return { path: args.path, external: true };
    });
    b.onLoad({ filter: /\.(ts|mts|mjs|js)$/ }, (args) => {
      if (args.path.includes('/node_modules/')) return undefined;
      const text = readFileSync(args.path, 'utf8');
      if (!text.includes('import.meta.')) return { contents: text, loader: args.path.endsWith('ts') ? 'ts' : 'js' };
      const url = JSON.stringify(pathToFileURL(args.path).href);
      return {
        contents: text
          .replaceAll('import.meta.url', url)
          .replaceAll('import.meta.dirname', JSON.stringify(dirname(args.path)))
          .replaceAll('import.meta.filename', JSON.stringify(args.path)),
        loader: args.path.endsWith('ts') ? 'ts' : 'js',
      };
    });
  },
};

/** The bundle's path for a build entry (a file, or `contents` run from `resolveDir`), or undefined when it can't be made. */
export function bundleEntry(name, entry) {
  if (!made.has(name))
    made.set(
      name,
      (async () => {
        try {
          mkdirSync(dir, { recursive: true });
          const outfile = join(dir, `${name}.mjs`);
          await build({
            ...(entry.file
              ? { entryPoints: [entry.file] }
              : { stdin: { contents: entry.contents, resolveDir: root, sourcefile: `${name}-entry.mjs`, loader: 'js' } }),
            outfile,
            bundle: true,
            platform: 'node',
            format: 'esm',
            target: 'esnext',
            sourcemap: true,
            logLevel: 'silent',
            absWorkingDir: join(root, 'web'),
            conditions: ['gamemaker-source', 'module', 'node'],
            plugins: [sourceMeta],
          });
          return outfile;
        } catch {
          return undefined;
        }
      })(),
    );
  return made.get(name);
}
