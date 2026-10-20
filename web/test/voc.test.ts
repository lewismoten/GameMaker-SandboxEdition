import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { decodeVoc, isVoc } from '../src/formats/voc';

const gameware = resolve(__dirname, '../../cd/gameware');
const vocs = existsSync(gameware)
  ? readdirSync(gameware).flatMap((d) =>
      readdirSync(join(gameware, d))
        .filter((f) => f.endsWith('.voc'))
        .map((f) => join(gameware, d, f)),
    )
  : [];

describe('voc', () => {
  it.skipIf(!vocs.length)('decodes every sample sound effect', () => {
    for (const f of vocs) {
      const bytes = new Uint8Array(readFileSync(f));
      expect(isVoc(bytes), f).toBe(true);
      const voc = decodeVoc(bytes);
      expect(voc.sampleRate, f).toBeGreaterThan(3000);
      expect(voc.sampleRate, f).toBeLessThan(50000);
      expect(voc.samples.length, f).toBeGreaterThan(0);
    }
  });
});
