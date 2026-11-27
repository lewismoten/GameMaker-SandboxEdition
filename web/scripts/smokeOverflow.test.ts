// Regression for a mobile layout viewport widened by overflowing content.
import { expect, it, vi } from 'vitest';
import { homeOverflow } from './smokeOverflow';

it('reports sideways scroll beyond the configured 390 px profile', () => {
  vi.stubGlobal('document', { documentElement: { scrollWidth: 625 } });
  vi.stubGlobal('innerWidth', 625);
  try {
    expect(homeOverflow(390)).toBe(235);
  } finally {
    vi.unstubAllGlobals();
  }
});
