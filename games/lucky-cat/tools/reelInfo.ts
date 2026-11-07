// How long each cartoon is: frames and seconds, from the code (not the disk).
//   cd web && npx vite-node ../games/lucky-cat/tools/reelInfo.ts
import { buildCatBlocks, catPicture } from '../src/cat';
import { buildLevels } from '../src/levels';
import { endingReel, introReel, REEL_SPEED } from '../src/reels';

const { pal, levels } = buildLevels();
const cat = catPicture(buildCatBlocks(pal), 'stand.top', 'stand');
for (const [name, r] of [
  ['intro', introReel(pal, levels[0].book, cat)],
  ['ending', endingReel(pal, levels[0].book, cat)],
] as const) {
  console.log(`${name}: ${r.frames.length} frames, ${r.seconds(REEL_SPEED).toFixed(1)} s`);
}
