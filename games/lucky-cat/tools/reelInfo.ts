// How long each cartoon is: frames and seconds, from the code (not the disk).
//   cd web && npx vite-node ../games/lucky-cat/tools/reelInfo.ts
import { buildCatBlocks, catPicture } from '../src/cat';
import { buildCatPalette } from '../src/palette';
import { rascalSprite } from '../src/rascal';
import { endingReel, introReel, REEL_SPEED } from '../src/reels';

const pal = buildCatPalette();
const blocks = buildCatBlocks(pal);
const cat = catPicture(blocks, 'stand.top', 'stand');
const smug = catPicture(blocks, 'look.top', 'stand');
const cheer = catPicture(blocks, 'cheer.top', 'jump');
const rascal = rascalSprite(pal);
for (const [name, r] of [
  ['intro', introReel(pal, cat, smug, rascal)],
  ['ending', endingReel(pal, smug, cheer, rascal)],
] as const) {
  console.log(`${name}: ${r.frames.length} frames, ${r.seconds(REEL_SPEED).toFixed(1)} s`);
}
