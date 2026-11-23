// Idle tour hosts draw a first frame for both preferences. Only regular motion cycles it.
import { afterEach, expect, it, vi } from 'vitest';
import { Actor } from './actor';

afterEach(() => vi.unstubAllGlobals());

it.each([true, false])('honors reduced motion (%s) on a newly displayed host', (reduced) => {
  const setInterval = vi.fn();
  const drawImage = vi.fn();
  const canvas = { style: {}, getContext: () => ({ clearRect: vi.fn(), drawImage }) };
  vi.stubGlobal('document', { createElement: () => canvas });
  vi.stubGlobal('window', { setInterval });
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduced && query === '(prefers-reduced-motion: reduce)' }));
  const frame = document.createElement('canvas');
  new Actor({ sprite: { w: 1, h: 1, walk: false, ms: 100, frames: [], colors: [] }, front: [frame], walk: [], acts: {} }, 1, false);
  expect(drawImage).toHaveBeenCalledOnce();
  expect(setInterval).toHaveBeenCalledTimes(reduced ? 0 : 1);
});
