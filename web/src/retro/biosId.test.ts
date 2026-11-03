import { describe, expect, it } from 'vitest';
import { biosId } from './biosId';

describe('biosId', () => {
  it('carries the commit as the board code, uppercase like the rest of the line', () => {
    expect(biosId('a1f9a5c5343c14d209cbfae3bc4aad94af2f6cfd')).toBe('07/21/93-AWK-486DX2-A1F9A5C5-00');
  });

  it('prints zeros when the build knows no commit', () => {
    expect(biosId('')).toBe('07/21/93-AWK-486DX2-00000000-00');
    expect(biosId('not-a-hash')).toBe('07/21/93-AWK-486DX2-00000000-00');
  });

  it('fits the bottom row', () => {
    expect(biosId('a1f9a5c5').length).toBeLessThan(80);
  });
});
