// Build this package using only its own source and declared npm dependencies.
import { build } from 'vite';
import { readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url));
const sources = {
  index: 'index',
  zip: 'project/zip',
  pack: 'project/gamePack',
  scan: 'project/importScan',
  'player/applyPatches': 'player/applyPatches',
  'player/md5': 'player/md5',
  'project/extensionNames': 'project/extensionNames',
  'project/importLeftovers': 'project/importLeftovers',
  'project/importPlayer': 'project/importPlayer',
};
const entry = Object.fromEntries(Object.entries(sources).map(([name, file]) => [name, resolve(here, 'src', file + '.ts')]));
rmSync(resolve(here, 'dist'), { recursive: true, force: true });
await build({
  configFile: false,
  root: here,
  base: './',
  publicDir: false,
  logLevel: 'warn',
  build: {
    target: 'es2022',
    outDir: resolve(here, 'dist'),
    emptyOutDir: true,
    lib: { entry, formats: ['es'], fileName: (_format, name) => name + '.js' },
    rollupOptions: { external: [/^node:/, /^@lewismoten\//] },
  },
  worker: { format: 'es' },
});
execFileSync(process.execPath, [createRequire(import.meta.url).resolve('typescript/bin/tsc'), '-p', resolve(here, 'tsconfig.json')], { stdio: 'inherit' });
// NodeNext declarations keep explicit relative JS extensions.
function finish(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) finish(p);
    else if (e.name.endsWith('.d.ts'))
      writeFileSync(
        p,
        readFileSync(p, 'utf8').replace(/(from\s+|import\s*\()(['"])(\.[^'"]+)\2/g, (_all, lead, q, s) => {
          const target = resolve(dir, s);
          return lead + q + s + (existsSync(target + '.d.ts') ? '.js' : existsSync(resolve(target, 'index.d.ts')) ? '/index.js' : '') + q;
        }),
      );
  }
}
finish(resolve(here, 'dist/types'));
