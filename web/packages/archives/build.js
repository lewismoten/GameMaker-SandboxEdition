// Bundle portable browser/Node archive APIs independently of the site build.
import { build } from 'vite';
import { copyFileSync, rmSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const entry = {
  index: resolve(here, 'src/index.ts'),
  zip: resolve(here, '../../src/project/zip.ts'),
  pack: resolve(here, '../../src/project/gamePack.ts'),
  scan: resolve(here, '../../src/project/importScan.ts'),
};
rmSync(resolve(here, 'dist'), { recursive: true, force: true });
await build({
  configFile: false,
  root: here,
  publicDir: false,
  logLevel: 'warn',
  build: {
    target: 'es2022',
    outDir: resolve(here, 'dist'),
    emptyOutDir: true,
    lib: { entry, formats: ['es'], fileName: (_format, name) => `${name}.js` },
    rollupOptions: { external: [/^node:/] },
  },
});
copyFileSync(resolve(here, '../../../LICENSE'), resolve(here, 'LICENSE'));

execFileSync(process.execPath, [createRequire(import.meta.url).resolve('typescript/bin/tsc'), '-p', resolve(here, 'tsconfig.json')], { stdio: 'inherit' });
// NodeNext consumers need explicit extensions in declarations as well as bundled JS.
function finishTypes(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) finishTypes(path);
    else if (entry.name.endsWith('.d.ts')) {
      const text = readFileSync(path, 'utf8').replace(/(from\s+|import\s*\()(['"])(\.[^'"]+)\2/g, (all, lead, quote, specifier) => {
        const target = resolve(dir, specifier);
        const suffix = existsSync(target + '.d.ts') ? '.js' : existsSync(resolve(target, 'index.d.ts')) ? '/index.js' : '';
        return lead + quote + specifier + suffix + quote;
      });
      writeFileSync(path, text);
    }
  }
}
finishTypes(resolve(here, 'dist/types'));
