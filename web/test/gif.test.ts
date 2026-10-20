import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { decodeGif, encodeGif, isGif } from '../src/formats/gif';

const gameware = resolve(__dirname, '../../cd/gameware');
const gifs = existsSync(gameware)
  ? readdirSync(gameware).flatMap((d) => {
      try {
        return readdirSync(join(gameware, d)).filter((f) => f.endsWith('.gif')).map((f) => join(gameware, d, f));
      } catch {
        return [];
      }
    })
  : [];

describe('gif', () => {
  it.skipIf(!gifs.length)('decodes every sample GIF and re-encodes losslessly', () => {
    for (const f of gifs) {
      const bytes = new Uint8Array(readFileSync(f));
      // Skip files truncated on the CD image and two pipemare files that aren't really GIFs.
      if (bytes.length === 16384 || !isGif(bytes)) continue;
      const img = decodeGif(bytes);
      expect(img.width * img.height, f).toBeGreaterThan(0);
      const again = decodeGif(encodeGif(img));
      expect(Buffer.compare(again.pixels, img.pixels), f).toBe(0);
      expect(Buffer.compare(again.palette, img.palette), f).toBe(0);
    }
  }, 60_000);
});
