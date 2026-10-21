// Tests: Reading Autodesk Animator .FLI animations (formats/fli.ts).
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { applyFliFrame, newFliCanvas, parseFli } from '../src/formats/fli';

const gameware = resolve(__dirname, '../../cd/gameware');
const flis = existsSync(gameware)
  ? readdirSync(gameware).flatMap((d) =>
      readdirSync(join(gameware, d))
        .filter((f) => f.endsWith('.fli'))
        .map((f) => join(gameware, d, f)),
    )
  : [];

describe('fli', () => {
  it.skipIf(!flis.length)('decodes every sample animation to a non-empty picture', () => {
    for (const f of flis) {
      const bytes = new Uint8Array(readFileSync(f));
      if (bytes.length === 16384) continue; // truncated on the CD image
      const anim = parseFli(bytes);
      expect(anim.frames.length, f).toBeGreaterThanOrEqual(anim.frameCount);
      const canvas = newFliCanvas(anim);
      let paletteSet = false;
      for (let i = 0; i < anim.frameCount; i++) paletteSet = applyFliFrame(anim, i, canvas) || paletteSet;
      expect(paletteSet, f).toBe(true);
      expect(canvas.palette.every((v) => v < 64), f).toBe(true);
    }
  }, 60_000);
});
