// Lossless temporary animation frames: independent renders can run in separate five-minute CI jobs.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deserialize, serialize } from 'node:v8';
import { gzipSync, gunzipSync } from 'node:zlib';
import type { Picture } from './image';
export function cachedFrame(key: string, render: () => Picture): Picture {
  const dir = process.env.DEPTH_FRAME_CACHE;
  if (!dir) return render();
  const shard = process.env.DEPTH_FRAME_SHARD;
  if (shard) {
    const [index, count] = shard.split('/').map(Number);
    let owner = 0;
    for (const ch of key) owner = (owner * 31 + ch.charCodeAt(0)) >>> 0;
    if (owner % count !== index) return { w: 320, h: 200, rgb: new Float32Array(320 * 200 * 3) };
  }
  const file = join(dir, `${key}.bin.gz`);
  if (existsSync(file)) return deserialize(gunzipSync(readFileSync(file))) as Picture;
  const picture = render();
  writeFileSync(file, gzipSync(serialize(picture)));
  return picture;
}
