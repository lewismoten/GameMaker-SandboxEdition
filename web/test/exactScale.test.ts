import { describe, expect, it } from 'vitest';
import { exactSize } from '../src/player/exactScale';

describe('exactSize', () => {
  it('keeps the shown device size and blows up to the next whole multiple', () => {
    expect(exactSize(401.4, 300.6, 320, 200)).toEqual([401, 301, 2, 2]);
    expect(exactSize(1000, 750, 320, 200)).toEqual([1000, 750, 4, 4]);
  });
  it('leaves whole multiples alone', () => {
    expect(exactSize(640, 400, 320, 200)).toEqual([640, 400, 2, 2]);
    expect(exactSize(320, 200, 320, 200)).toEqual([320, 200, 1, 1]);
  });
});
