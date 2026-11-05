// Renders a sample title in each group look (titleStyles.ts) with a made-up name, to look at them:
//   cd web && npx vite-node ../games/kit/starter/titleSamples.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { buildLevels } from '../../first-steps/src/levels';
import { buildHeroBlocks, heroPicture } from './hero';
import { skyOf } from './palette';
import { titlePicture, type GroupStyle } from './screens';

const out = process.argv[2] ?? 'title-samples';
mkdirSync(out, { recursive: true });
const { book, pal } = buildLevels();
const heroBlocks = buildHeroBlocks(pal);
const hero = heroPicture(heroBlocks, 'stand.top', 'stand');
const door = heroPicture(book, 'doorTop', 'doorBottom').map((_x, _y, c) => (c === skyOf(pal) ? 255 : c));
for (const style of ['meadow', 'sunset', 'breeze', 'dressing', 'arena', 'circuit', 'stage', 'workbench', 'atlas', 'neon'] as GroupStyle[]) {
  const prize = style === 'neon' || style === 'sunset' ? 'key' : 'coins';
  writePng(join(out, `${style}.png`), titlePicture(pal, book, hero, door, 'SAMPLE GAME', 'A STARTER GAME', prize, style), pal.pal, 3);
}
