// Design preview: Rory's and Mr. Plume's poses at 6x on the street's paper, as a PNG (never on the disk).
//   cd web && npx vite-node ../games/pass-the-pie/tools/heroPreview.ts [out.png] [mood]
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { heroPicture } from '../../kit/starter/hero';
import { buildPalette, moodBytes, type Mood } from '../src/palette';
import { buildPlumeBlocks } from '../src/plume';
import { paperBlock } from '../src/print';
import { buildRoryBlocks } from '../src/rory';

const pal = buildPalette();
const poses: [string, string][] = [
  ['stand.top', 'stand'],
  ['stand.top', 'walk0'],
  ['stand.top', 'walk1'],
  ['stand.top', 'walk2'],
  ['up.top', 'jumpup'],
  ['oh.top', 'fall'],
  ['back.top', 'climb0'],
  ['cheer2.top', 'cheer'],
  ['hurt.top', 'hurt'],
];
const kicks: [string, string][] = [
  ['kick0.top', 'throw0'],
  ['kick1.top', 'throw1'],
  ['stand.top', 'throw2'],
];
const rory = buildRoryBlocks(pal);
const plume = buildPlumeBlocks(pal);
const cols = poses.length + kicks.length;
const s = paperBlock(pal, cols * 24 + 4, 92, 3);
poses.forEach(([t, b], i) => s.blit(heroPicture(rory, t, b), 4 + i * 24, 2, 255));
[...poses, ...kicks].forEach(([t, b], i) => s.blit(heroPicture(plume, t, b), 4 + i * 24, 50, 255));
const out = process.argv[2] ?? join(tmpdir(), 'heroes.png');
writePng(out, s, moodBytes(pal, (process.argv[3] as Mood) ?? 'yard'), 6);
console.log(out);
