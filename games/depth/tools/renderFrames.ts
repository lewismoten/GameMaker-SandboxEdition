// Generate only one shard of independent animation frames; final assembly uses full, lossless pictures.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { introFrames } from '../src/screens/intro';
import { endingFrames } from '../src/screens/ending';
const started = Date.now();
const dir = process.env.DEPTH_FRAME_CACHE;
const shard = process.argv[2];
if (!dir || !/^[0-7]\/8$/.test(shard ?? '')) throw new Error('Set DEPTH_FRAME_CACHE and give a frame shard (0/8 through 7/8).');
mkdirSync(dir, { recursive: true });
process.env.DEPTH_FRAME_SHARD = shard;
introFrames();
endingFrames();
writeFileSync(join(dir, `shard-${shard[0]}.json`), JSON.stringify({ shard }));
console.log(`Animation frame shard ${shard} ready in ${((Date.now() - started) / 1000).toFixed(1)} seconds.`);
