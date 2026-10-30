// Build this package using only its own source and declared npm dependencies.
import { build } from 'vite';
import { readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url));
const sources = {
  'audio/cmfLoad': 'audio/cmfLoad',
  'audio/cmfPlayer': 'audio/cmfPlayer',
  'audio/context': 'audio/context',
  'audio/engine': 'audio/engine',
  'audio/opl': 'audio/opl',
  'audio/output': 'audio/output',
  'core/gameFiles': 'core/gameFiles',
  'engine/character': 'engine/character',
  'engine/funcKeys': 'engine/funcKeys',
  'engine/game': 'engine/game',
  'engine/keys': 'engine/keys',
  'engine/machine': 'engine/machine',
  'engine/menus': 'engine/menus',
  'engine/monsters': 'engine/monsters',
  'engine/playGain': 'engine/playGain',
  'engine/playerLook': 'engine/playerLook',
  'engine/recorder': 'engine/recorder',
  'engine/render': 'engine/render',
  'engine/scene': 'engine/scene',
  'engine/scroll': 'engine/scroll',
  'engine/showGraphic': 'engine/showGraphic',
  'engine/slowPc': 'engine/slowPc',
  'engine/touch': 'engine/touch',
  'engine/world': 'engine/world',
  'formats/binary': 'formats/binary',
  'formats/blocks': 'formats/blocks',
  'formats/character': 'formats/character',
  'formats/cmf': 'formats/cmf',
  'formats/cmfEdit': 'formats/cmfEdit',
  'formats/cmfPreview': 'formats/cmfPreview',
  'formats/cmfSong': 'formats/cmfSong',
  'formats/fli': 'formats/fli',
  'formats/fliFrames': 'formats/fliFrames',
  'formats/fliLimits': 'formats/fliLimits',
  'formats/game': 'formats/game',
  'formats/gif': 'formats/gif',
  'formats/gifProgressive': 'formats/gifProgressive',
  'formats/graphicScripts': 'formats/graphicScripts',
  'formats/highscore': 'formats/highscore',
  'formats/jpeg': 'formats/jpeg',
  'formats/map': 'formats/map',
  'formats/monster': 'formats/monster',
  'formats/palette': 'formats/palette',
  'formats/recording': 'formats/recording',
  'formats/sound': 'formats/sound',
  'formats/voc': 'formats/voc',
  'gfx/cp437Glyphs': 'gfx/cp437Glyphs',
  'gfx/font8x8': 'gfx/font8x8',
  'gfx/screen': 'gfx/screen',
  index: 'index',
  'input/chords': 'input/chords',
  'input/deskMouse': 'input/deskMouse',
  'input/keyboard': 'input/keyboard',
  'input/scancodes': 'input/scancodes',
  'player/fileExtensions': 'player/fileExtensions',
  'player/patchRules': 'player/patchRules',
  'player/patchTable': 'player/patchTable',
  'text/cp437': 'text/cp437',
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
