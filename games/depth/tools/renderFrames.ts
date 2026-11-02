// Generate only one shard of independent animation frames; final assembly uses full, lossless pictures.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { introFrames } from '../src/screens/intro';
import { endingFrames } from '../src/screens/ending';
import * as P from '../src/screens/pictures';
import { storyPictures } from '../src/screens/story';
import { titlePicture } from '../src/screens/title';
import { spritePictures } from '../src/sprites/sprites';
import { levelPictures } from '../src/levels/blocks';
import { LEVELS } from '../src/levels/levels';
import { levelExtras } from '../src/levels/extras';
const started = Date.now();
const dir = process.env.DEPTH_FRAME_CACHE;
const shard = process.argv[2];
if (!dir || !/^[0-7]\/8$/.test(shard ?? '')) throw new Error('Set DEPTH_FRAME_CACHE and give a frame shard (0/8 through 7/8).');
mkdirSync(dir, { recursive: true });
process.env.DEPTH_FRAME_SHARD = shard;
introFrames();
endingFrames();
// the other ray-traced pictures, so the build job only assembles them (their text is added after the cache)
storyPictures(titlePicture());
P.menuPicture();
P.howtoPicture();
P.howtoBackground();
P.castPicture();
P.creditsBackground();
P.hiscorePicture();
P.savePicture('SAVE GAME');
P.lostPicture();
P.eggPicture();
for (let n = 1; n <= 6; n++) P.cardPicture(n, 6, '', '', []);
spritePictures();
// every level's blocks (the build only reads them)
for (const level of LEVELS) {
  const x = levelExtras(level);
  levelPictures(level, x.rules, x.prepare);
}
writeFileSync(join(dir, `shard-${shard[0]}.json`), JSON.stringify({ shard }));
console.log(`Animation frame shard ${shard} ready in ${((Date.now() - started) / 1000).toFixed(1)} seconds.`);
