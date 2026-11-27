// Browser regressions for dialog names, geometry and minimum targets.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Browser, BrowserContextOptions, Page } from 'playwright-core';
import { launch } from './perfLib';
import { measure } from './dialogsFitMeasure';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

describe('dialog measurements', () => {
  let browser: Browser;
  async function withPage(options: BrowserContextOptions, check: (page: Page) => Promise<void>) {
    const context = await browser.newContext(options);
    try {
      await check(await context.newPage());
    } finally {
      await context.close();
    }
  }

  beforeAll(async () => {
    browser = await launch();
  });
  afterEach(() => {
    expect(browser.contexts()).toHaveLength(0);
  });
  afterAll(async () => {
    await browser?.close();
  });

  it.each([
    [400, 60, 1, 0],
    [320, 90, 0, 1],
    [400, 90, 1, 1],
  ])('classifies marked list overflow for %i by %i content', (width, height, hard, allowed) =>
    withPage({}, async (page) => {
      await page.setContent(
        `<dialog open aria-label="Questions"><div data-list-area="questions" style="width:320px;height:60px;overflow:auto"><div style="width:${width}px;height:${height}px"></div></div><button style="height:30px">Close</button></dialog>`,
      );
      const { problems } = await measure(page);
      expect(problems.filter((problem) => !problem.includes('[allowed list]'))).toHaveLength(hard);
      expect(problems.filter((problem) => problem.includes('[allowed list]'))).toHaveLength(allowed);
    }));

  it('keeps a full-size checkbox target when its separate caption is shorter', () =>
    withPage({}, async (page) => {
      await page.setContent(
        '<dialog aria-label="Options"><input id="check" type="checkbox" style="width:24px;height:24px"><label for="check" style="display:inline-block;height:20px">Preview</label><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
      );
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      expect((await measure(page)).problems).toEqual([]);
    }));

  it('does not audit controls inside collapsed details as visible targets', () =>
    withPage({}, async (page) => {
      await page.setContent(
        '<dialog aria-label="Settings"><details><summary style="min-height:30px">More</summary><input type="checkbox" aria-label="Hidden choice" style="width:12px;height:12px"></details><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
      );
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      expect((await measure(page)).problems).toEqual([]);
    }));

  it('uses the configured phone width when mobile emulation expands the layout viewport', () =>
    withPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async (page) => {
      await page.setContent(
        '<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{width:900px}</style><dialog aria-label="Test"><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
      );
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      expect((await measure(page)).problems.some((problem) => problem.startsWith('page scrolls sideways'))).toBe(true);
    }));

  it('counts an explicitly associated checkbox label as its hit target', () =>
    withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
      await page.setContent(
        '<dialog aria-label="Checklist"><input id="check" type="checkbox" style="width:12px;height:12px"><label for="check" style="display:inline-block;min-width:100px;min-height:30px">Check this</label><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
      );
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      expect((await measure(page)).problems).toEqual([]);
    }));

  it('reports unnamed dialogs and undersized buttons', () =>
    withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
      await page.setContent('<dialog><button aria-label="Close" style="width:12px;height:12px;padding:0;border:0">×</button></dialog>');
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      const result = await measure(page);
      expect(result.problems).toContain('dialog has no accessible name');
      expect(result.problems.some((problem) => problem.includes('target') && problem.includes('12x12'))).toBe(true);
    }));
});
