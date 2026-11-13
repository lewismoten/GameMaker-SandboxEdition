// cameraTop: the screen's first map row from the hero's sprites (feet 120 of 200 px down).
import { describe, expect, it } from 'vitest';
import { cameraTop } from './levelPicture';

describe('cameraTop', () => {
  it('puts the hero feet edge six rows below the top', () => {
    expect(
      cameraTop([
        { x: 14, y: 20 },
        { x: 14, y: 21 },
      ]),
    ).toBe(16);
  });
  it('ignores sprites in other columns', () => {
    expect(
      cameraTop([
        { x: 14, y: 20 },
        { x: 14, y: 21 },
        { x: 30, y: 40 },
      ]),
    ).toBe(16);
  });
});
