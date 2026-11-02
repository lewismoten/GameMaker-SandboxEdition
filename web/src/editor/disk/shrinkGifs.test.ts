import { describe, expect, it } from 'vitest';
import { decodeGif, encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { shrinkGif } from '@lewismoten/gamemaker-sandbox-tools/gif-shrink';
import { GameFiles } from '../../project/files';
import { planDisk } from './plan';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

function pic(top: number, noise = false) {
  const palette = new Uint8Array(768);
  for (let i = 0; i <= top; i++) palette.set([i % 64, (i * 3) % 64, (i * 7) % 64], i * 3);
  if (noise) palette.set([9, 9, 9], 200 * 3);
  const pixels = Uint8Array.from({ length: 64 * 40 }, (_, i) => (i * 5 + (i >> 6)) % (top + 1));
  return { width: 64, height: 40, pixels, palette };
}

describe('shrinkGif', () => {
  it.each([1, 2, 3, 7, 8, 15, 100])('keeps every pixel and screen color when %i is the highest color used', (top) => {
    const src = encodeGif(pic(top));
    const r = shrinkGif(src);
    const want = top < 4 ? 4 : 2 ** Math.ceil(Math.log2(top + 1));
    if (want >= 256) return expect(r).toBeUndefined();
    expect(r!.to).toBe(want);
    expect(r!.bytes.length).toBeLessThan(src.length);
    const [a, b] = [decodeGif(src), decodeGif(r!.bytes)];
    expect(Array.from(b.pixels)).toEqual(Array.from(a.pixels));
    expect(Array.from(b.palette)).toEqual(Array.from(a.palette));
  });
  it('leaves a picture alone when a dropped table entry is not black or a high color is used', () => {
    expect(shrinkGif(encodeGif(pic(7, true)))).toBeUndefined();
    expect(shrinkGif(encodeGif(pic(200)))).toBeUndefined();
  });
  it('is one undoable-sized step in the plan and does nothing the second time', () => {
    const f = new GameFiles();
    f.set('t.gif', encodeGif(pic(5)));
    f.set('t.gam', serializeGame(newGame('T')));
    const plan = planDisk(f, 't.gam');
    expect(plan.steps.map((s) => s.kind)).toEqual(['gif']);
    plan.steps[0].apply(f, 't.gam');
    expect(planDisk(f, 't.gam').steps).toEqual([]);
  });
});
