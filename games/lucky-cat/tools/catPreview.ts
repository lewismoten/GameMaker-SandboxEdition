// Design preview (never on the disk): Midnight's poses as a PNG sheet.
//   cd web && npx vite-node ../games/lucky-cat/tools/catPreview.ts [outDir] [scale]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { buildCatBlocks, catPicture } from '../src/cat';
import { buildCatPalette } from '../src/palette';

const out = process.argv[2] ?? join(tmpdir(), 'lucky-cat-preview');
const scale = Number(process.argv[3] ?? 6);
mkdirSync(out, { recursive: true });
const pal = buildCatPalette();
const cb = buildCatBlocks(pal);
const poses: [string, string][] = [
  ['stand.top', 'stand'],
  ['blink.top', 'stand'],
  ['hurt.top', 'hurt'],
  ['cheer.top', 'jump'],
  ['stand.top', 'walk0'],
  ['stand.top', 'walk1'],
  ['stand.top', 'walk2'],
  ['up.top', 'jumpup'],
  ['oh.top', 'fall'],
  ['cheer2.top', 'cheer'],
  ['back.top', 'climb0'],
  ['back.top', 'climb1'],
];
const sheet = new Pixels(poses.length * 24 + 4, 44, pal.c('sky', 3));
poses.forEach(([t, b], i) => sheet.blit(catPicture(cb, t, b), 4 + i * 24, 2, 255));
writePng(join(out, 'cat.png'), sheet, pal.pal, scale);
console.log(join(out, 'cat.png'));
