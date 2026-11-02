import { describe, expect, it } from 'vitest';
import { pickableBlocks } from './blockChoice';

describe('pickableBlocks', () => {
  it('lists only blocks with something drawn on them', () => {
    const flat = new Uint8Array(256);
    const drawn = new Uint8Array(256);
    drawn[5] = 9;
    expect(pickableBlocks([{ pixels: flat }, { pixels: drawn }, { pixels: flat }], false)).toEqual([1]);
  });
});
