// Draws Penny's poses large, for a look at her (scratch use): vite-node _pennyPeek.ts <out.png>
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { heroPicture } from '../../kit/starter/hero';
import { buildPennyBlocks, pennyPalette } from '../src/look';

const pal = pennyPalette();
const b = buildPennyBlocks(pal);
const poses: [string, string][] = [
  ['stand.top', 'stand'],
  ['stand.top', 'walk1'],
  ['cheer.top', 'jump'],
  ['up.top', 'jumpup'],
  ['back.top', 'climb0'],
  ['hurt.top', 'hurt'],
  ['cheer2.top', 'cheer'],
];
const out = new Pixels(poses.length * 90, 180, pal.c('sky', 3));
poses.forEach(([t, bo], i) => scaleBlit(out, heroPicture(b, t, bo), i * 90 + 5, 5, 4, false, 255));
writePng(process.argv[2], out, pal.pal as never, 1);
