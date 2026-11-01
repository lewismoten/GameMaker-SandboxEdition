// insideDir: the MCP exports' local fetch must not read a sibling folder that shares a prefix.
import { describe, expect, it } from 'vitest';
import { insideDir } from './exports';

describe('insideDir', () => {
  it('accepts the folder and what is in it', () => {
    expect(insideDir('/app/dist', '/app/dist')).toBe(true);
    expect(insideDir('/app/dist/a/b.js', '/app/dist')).toBe(true);
  });
  it('refuses a sibling with the same prefix and anything above', () => {
    expect(insideDir('/app/dist-old/secret', '/app/dist')).toBe(false);
    expect(insideDir('/app/other', '/app/dist')).toBe(false);
    expect(insideDir('/app', '/app/dist')).toBe(false);
  });
});
