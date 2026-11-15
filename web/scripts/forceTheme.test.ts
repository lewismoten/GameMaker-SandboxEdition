// forceTheme and assertTheme fail loudly when a "light" run stayed dark (no browser needed).
import { describe, expect, it, vi } from 'vitest';
import type { Page } from 'playwright-core';
import { assertTheme, forceTheme } from './forceTheme';

const pageWith = (state: { preference?: string; dark: boolean }) =>
  ({
    evaluate: vi.fn(async () => ({ ...state, ui: 'modern' })),
  }) as unknown as Page;

describe('assertTheme', () => {
  it('throws when emulated light media sits over a stored dark preference', async () => {
    await expect(assertTheme(pageWith({ preference: 'dark', dark: false }), 'light')).rejects.toThrow(/Expected the light theme/);
  });
  it('resolves auto through the color scheme before judging it', async () => {
    await expect(assertTheme(pageWith({ preference: 'auto', dark: true }), 'light')).rejects.toThrow(/resolved dark/);
  });
  it('throws when the page sets no theme at all', async () => {
    await expect(assertTheme(pageWith({ dark: false }), 'dark')).rejects.toThrow(/Expected the dark theme/);
  });
});

describe('forceTheme', () => {
  it('stores the theme under the site key in every new page', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    const ctx = { addInitScript: vi.fn(async (script: (t: string) => void, arg: string) => script(arg)) };
    await forceTheme(ctx, 'light');
    expect(setItem).toHaveBeenCalledWith('gm-theme', 'light');
    vi.unstubAllGlobals();
  });
});
