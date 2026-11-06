import { afterEach, describe, expect, it, vi } from 'vitest';
import { inArchiveReplay } from './replay';

describe('inArchiveReplay', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('is false on a normal host', () => {
    vi.stubGlobal('window', {});
    expect(inArchiveReplay()).toBe(false);
  });
  it("is true when the replay's globals exist", () => {
    vi.stubGlobal('window', { _WBWombat: () => undefined });
    expect(inArchiveReplay()).toBe(true);
    vi.stubGlobal('window', { __wm: {} });
    expect(inArchiveReplay()).toBe(true);
  });
});
