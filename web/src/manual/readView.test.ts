// readView.ts: a phone opens documents in Scroll and a larger screen in Pages, until the visitor
// picks one, which this browser then keeps.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readView, viewFor } from './readView';

describe('viewFor', () => {
  it('scrolls on a phone, held either way, and turns pages elsewhere', () => {
    expect(viewFor(null, 'tall')).toBe('scroll');
    expect(viewFor(null, 'wide')).toBe('scroll');
    expect(viewFor(null, 'off')).toBe('pages');
  });

  it('keeps the view the visitor chose, on any screen', () => {
    expect(viewFor('pages', 'tall')).toBe('pages');
    expect(viewFor('scroll', 'off')).toBe('scroll');
    expect(viewFor('sideways', 'off')).toBe('pages');
  });
});

describe('readView', () => {
  afterEach(() => vi.unstubAllGlobals());

  const screen = (width: number, height: number, coarse: boolean) => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('innerWidth', width);
    vi.stubGlobal('innerHeight', height);
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: coarse && q === '(pointer: coarse)' }));
  };
  const stored = (value: string | null) => vi.stubGlobal('localStorage', { getItem: (k: string) => (k === 'gm-read-view' ? value : null) });

  it('asks the screen when nothing is kept', () => {
    stored(null);
    screen(390, 844, true);
    expect(readView()).toBe('scroll');
    screen(844, 390, true);
    expect(readView()).toBe('scroll');
    screen(1440, 900, false);
    expect(readView()).toBe('pages');
    screen(390, 844, false); // a narrow desktop window is not a phone
    expect(readView()).toBe('pages');
    screen(820, 1180, true); // nor is a tablet
    expect(readView()).toBe('pages');
  });

  it('opens in the view this browser kept', () => {
    stored('pages');
    screen(390, 844, true);
    expect(readView()).toBe('pages');
    stored('scroll');
    screen(1440, 900, false);
    expect(readView()).toBe('scroll');
  });

  it('falls back to the screen when storage is shut', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
    });
    screen(390, 844, true);
    expect(readView()).toBe('scroll');
  });
});
