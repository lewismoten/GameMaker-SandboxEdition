// Content readiness must hold a trace open until the map loads, and fail when it never does.
import type { Page } from 'playwright-core';
import { describe, expect, it, vi } from 'vitest';
import { TRACE_PAGES, waitForTraceContent } from './perfTracePages';

describe('page-load trace readiness', () => {
  const map = TRACE_PAGES.find(([name]) => name === 'editor map')!;

  it('requires the map surface, rather than the editor shell or a block picker canvas', () => {
    expect(map).toEqual([
      'editor map',
      '/#/p/look:blaster/bus2.map',
      'main.editor [aria-label="The map (scroll with the arrow keys)"] .mt-stack canvas:not([aria-hidden])',
    ]);
    expect(TRACE_PAGES.filter(([, , ready]) => ready)).toHaveLength(1);
  });

  it('does not finish readiness while the map is still loading', async () => {
    let showMap!: () => void;
    const waitFor = vi.fn(() => new Promise<void>((resolve) => (showMap = resolve)));
    const locator = vi.fn(() => ({ waitFor }));
    const page = { locator } as unknown as Pick<Page, 'locator'>;
    let settled = false;
    const pending = waitForTraceContent(page, map[2]).then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(locator).toHaveBeenCalledWith(map[2]);
    expect(waitFor).toHaveBeenCalledWith({ state: 'visible', timeout: 40_000 });
    showMap();
    await pending;
    expect(settled).toBe(true);
  });

  it('rejects a missing map instead of accepting an idle shell', async () => {
    const page = { locator: () => ({ waitFor: () => Promise.reject(new Error('Map never appeared')) }) } as unknown as Pick<Page, 'locator'>;
    await expect(waitForTraceContent(page, map[2])).rejects.toThrow('Map never appeared');
  });

  it('keeps routes without a content selector on their existing settling waits', async () => {
    const locator = vi.fn();
    await waitForTraceContent({ locator });
    expect(locator).not.toHaveBeenCalled();
  });
});
