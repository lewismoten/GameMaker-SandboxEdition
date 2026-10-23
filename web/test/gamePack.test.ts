import { describe, expect, it } from 'vitest';
import { PackReader, decodePack, encodePack } from '../src/project/gamePack';

const files: [string, Uint8Array][] = [
  ['game.gam', new Uint8Array([1, 2, 3])],
  ['empty.txt', new Uint8Array(0)],
  ['big.map', Uint8Array.from({ length: 70000 }, (_, i) => i & 255)],
];

describe('gamePack', () => {
  it('reads back what it wrote', () => {
    expect(decodePack(encodePack(files))).toEqual(files);
  });

  it('hands out each file as soon as its bytes are in, whatever the chunk sizes', () => {
    const packed = encodePack(files);
    for (const step of [1, 7, 4096, packed.length]) {
      const r = new PackReader();
      const got: [string, Uint8Array][] = [];
      for (let at = 0; at < packed.length; at += step) got.push(...r.push(packed.subarray(at, at + step)));
      expect(got).toEqual(files);
      expect(r.done).toBe(true);
    }
  });

  it('refuses something else', () => {
    expect(() => decodePack(new Uint8Array([1, 2, 3, 4, 5, 6]))).toThrow();
    expect(() => decodePack(encodePack(files).subarray(0, 20))).toThrow(/cut short/);
  });
});
