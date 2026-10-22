// Tests: The picture editor's pure helpers (editors/picture/pictureLogic.ts).
import { describe, expect, it } from 'vitest';
import { isBlankBlock } from '../src/editor/editors/picture/pictureLogic';
import { newBlockSet } from '../src/formats/blocks';

describe('isBlankBlock', () => {
  it('treats new blocks as empty', () => {
    expect(isBlankBlock(newBlockSet('bbl')[5].pixels, false)).toBe(true);
    expect(isBlankBlock(newBlockSet('mbl')[5].pixels, true)).toBe(true);
  });
  it('treats a flat background color as empty but a flat sprite color as drawn', () => {
    const px = new Uint8Array(400).fill(7);
    expect(isBlankBlock(px, false)).toBe(true);
    expect(isBlankBlock(px, true)).toBe(false);
  });
  it('sees a single drawn pixel', () => {
    const px = new Uint8Array(400).fill(255);
    px[399] = 3;
    expect(isBlankBlock(px, true)).toBe(false);
    expect(isBlankBlock(px, false)).toBe(false);
  });
});
