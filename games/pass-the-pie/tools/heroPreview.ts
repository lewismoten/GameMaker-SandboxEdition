// Design preview: Rory's poses at 8x, as a PNG (never on the disk).
//   cd web && npx vite-node ../games/pass-the-pie/tools/heroPreview.ts [out.png]
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { heroPicture } from '../../kit/starter/hero';
import { buildPalette } from '../src/palette';
import { buildRoryBlocks } from '../src/rory';

const pal = buildPalette();
const h = buildRoryBlocks(pal);
const poses: [string, string][] = [
  ['stand.top', 'stand'],
  ['stand.top', 'walk1'],
  ['back.top', 'climb0'],
  ['cheer2.top', 'cheer'],
  ['hurt.top', 'hurt'],
  ['up.top', 'jumpup'],
];
const s = new Pixels(poses.length * 24 + 4, 44, pal.c('sky', 3));
poses.forEach(([t, b], i) => s.blit(heroPicture(h, t, b), 4 + i * 24, 2, 255));
const out = process.argv[2] ?? join(tmpdir(), 'rory.png');
writePng(out, s, pal.pal, 8);
console.log(out);
