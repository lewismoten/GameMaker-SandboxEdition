// Build this package using only its own source and declared npm dependencies.
import { build } from 'vite';
import { readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url));
const sources = {
  audio: 'audio',
  'audio-files': 'audioFiles',
  colors: 'colors',
  drawing: 'drawing',
  'image/png': 'image/png',
  images: 'images',
  'kit/audioEvents': 'kit/audioEvents',
  'kit/blit': 'kit/blit',
  'kit/clips': 'kit/clips',
  'kit/gameSim': 'kit/gameSim',
  'kit/music': 'kit/music',
  'kit/palette': 'kit/palette',
  'kit/pcText': 'kit/pcText',
  'kit/pixels': 'kit/pixels',
  'kit/reel': 'kit/reel',
  'kit/sceneSim': 'kit/sceneSim',
  'kit/shading': 'kit/shading',
  'kit/sound': 'kit/sound',
  'kit/textBounds': 'kit/textBounds',
  'kit/tune': 'kit/tune',
  'kit/microText': 'kit/microText',
  'kit/transforms': 'kit/transforms',
  'kit/coverPaint': 'kit/coverPaint',
  'kit/palRamps': 'kit/palRamps',
  'kit/quantize': 'kit/quantize',
  'kit/sdftext': 'kit/sdftext',
  'kit/raytrace': 'kit/raytrace',
  'kit/actors': 'kit/actors',
  'kit/screenText': 'kit/screenText',
  'kit/road3d': 'kit/road3d',
  'kit/saveSlots': 'kit/saveSlots',
  'kit/png': 'kit/png',
  'kit/photo': 'kit/photo',
  'kit/levelPicture': 'kit/levelPicture',
  'kit/synthParts': 'kit/synthParts',
  'kit/song': 'kit/song',
  'kit/songFx': 'kit/songFx',
  'kit/fadeOut': 'kit/fadeOut',
  'kit/fliClips': 'kit/fliClips',
  'kit/recordedDemo': 'kit/recordedDemo',
  'kit/hopBot': 'kit/hopBot',
  'kit/align': 'kit/align',
  'kit/sceneInit': 'kit/sceneInit',
  'kit/routeChecks': 'kit/routeChecks',
  'kit/disk': 'kit/disk',
  'kit/menuVersion': 'kit/menuVersion',
  microFont: 'microFont',
  'music/compose': 'music/compose',
  simulation: 'simulation',
  text: 'text',
  'formats/blocks': 'formats/blocks',
  'formats/character': 'formats/character',
  'formats/game': 'formats/game',
  'formats/map': 'formats/map',
  'formats/monster': 'formats/monster',
  'formats/palette': 'formats/palette',
  'formats/gif': 'formats/gif',
  'formats/graphicScripts': 'formats/graphicScripts',
  'formats/sound': 'formats/sound',
  'formats/fli': 'formats/fli',
  'formats/fliLimits': 'formats/fliLimits',
  'formats/voc': 'formats/voc',
  'formats/recording': 'formats/recording',
  'formats/cmf': 'formats/cmf',
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
