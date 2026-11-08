// Progress pictures: the title, a level as the player sees it (a 16 x 10 block window of Race to the Fair, with
// Midnight in it) and a frame of the ending cartoon, as PNGs at 2x.
//   cd web && npx vite-node ../games/lucky-cat/tools/shots.ts <outDir>
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildCatBlocks, catPicture } from '../src/cat';
import { finishBlocks } from '../src/level';
import { buildLevels } from '../src/levels';
import { LOOKS, swapped } from '../src/palette';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { rascalSprite } from '../src/rascal';
import { endingReel } from '../src/reels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const disk = new URL('../disk/', import.meta.url);

const title = decodeGif(readFileSync(new URL('title.gif', disk)));
const t = new Pixels(title.width, title.height);
t.px.set(title.pixels);
writePng(join(out, 'lucky-cat-title.png'), t, title.palette, 2);

const { pal, levels } = buildLevels();
const l = levels[4];
const mb = monsterPictures(pal);
const view = renderRegion(l.map.done(), finishBlocks(l), finishMonsterPictures(mb), monsterSet(mb), ORIGIN + 14, ORIGIN + 5, 16, 10);
const cat = catPicture(buildCatBlocks(pal), 'stand.top', 'stand');
view.blit(cat, 4 * 20, 60, 255);
writePng(join(out, 'lucky-cat-level.png'), view, swapped(pal, LOOKS[l.look]), 2);

const reel = endingReel(pal, catPicture(buildCatBlocks(pal), 'look.top', 'stand'), catPicture(buildCatBlocks(pal), 'cheer.top', 'jump'), rascalSprite(pal));
const frame = new Pixels(320, 200);
frame.px.set(reel.frames[60]);
writePng(join(out, 'lucky-cat-ending.png'), frame, reel.palettes[60], 2);
console.log(`pictures in ${out}`);
