// Lossless temporary animation frames: independent renders can run in separate five-minute CI jobs.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deserialize, serialize } from 'node:v8';
import { gzipSync, gunzipSync } from 'node:zlib';
import type { Picture } from './image';
import { SHARD_PLAN } from './shardPlan';
/** `group` names the frame whose shard should also render this one (when it is drawn from that frame's pixels). */
export function cachedFrame<T extends object = Picture>(key: string, render: () => T, group = key): T {
  const dir = process.env.DEPTH_FRAME_CACHE;
  if (!dir) return render();
  const shard = process.env.DEPTH_FRAME_SHARD;
  if (shard) {
    const [index, count] = shard.split('/').map(Number);
    let owner = SHARD_PLAN[group];
    if (owner === undefined || count !== 8) {
      owner = 0;
      for (const ch of group) owner = (owner * 31 + ch.charCodeAt(0)) >>> 0;
      owner %= count;
    }
    if (owner !== index) return { w: 320, h: 200, rgb: new Float32Array(320 * 200 * 3) } as unknown as T; // a placeholder: the shard that owns it renders the real one
  }
  const file = join(dir, `${key}.bin.gz`);
  if (existsSync(file)) return deserialize(gunzipSync(readFileSync(file))) as T;
  const began = Date.now();
  const picture = render();
  // `DEPTH_FRAME_TIMES=1` prints each frame's render time (what shardPlan.ts is balanced from)
  if (process.env.DEPTH_FRAME_TIMES) console.log(`frame ${key} ${Date.now() - began}`);
  writeFileSync(file, gzipSync(serialize(picture)));
  return picture;
}
