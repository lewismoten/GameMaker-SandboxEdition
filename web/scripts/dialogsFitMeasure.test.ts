// Browser regressions for dialog names, geometry and minimum targets.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { axeOn } from './dialogsFitAxe';
import { launch } from './perfLib';
import { measure } from './dialogsFitMeasure';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

describe('dialog measurements', () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await launch();
  });
  afterAll(async () => {
    await browser?.close();
  });

  it('audits the unnamed button in the top modal', async () => {
    const page = await browser.newPage();
    await page.setContent('<dialog aria-label="Base"><button>Close</button></dialog><dialog aria-label="Top"><button></button></dialog>');
    await page.locator('dialog').evaluateAll((dialogs) => dialogs.forEach((dialog) => (dialog as HTMLDialogElement).showModal()));
    expect(await axeOn(page, readFileSync('../node_modules/axe-core/axe.min.js', 'utf8'))).toContain('button-name x1');
  });

  it.each([
    [400, 60, 1, 0],
    [320, 90, 0, 1],
    [400, 90, 1, 1],
  ])('classifies marked list overflow for %i by %i content', async (width, height, hard, allowed) => {
    const page = await browser.newPage();
    await page.setContent(
      `<dialog open aria-label="Questions"><div data-list-area="questions" style="width:320px;height:60px;overflow:auto"><div style="width:${width}px;height:${height}px"></div></div><button style="height:30px">Close</button></dialog>`,
    );
    const { problems } = await measure(page);
    expect(problems.filter((problem) => !problem.includes('[allowed list]'))).toHaveLength(hard);
    expect(problems.filter((problem) => problem.includes('[allowed list]'))).toHaveLength(allowed);
    await page.close();
  });

  it('keeps a full-size checkbox target when its separate caption is shorter', async () => {
    const page = await browser.newPage();
    await page.setContent(
      '<dialog aria-label="Options"><input id="check" type="checkbox" style="width:24px;height:24px"><label for="check" style="display:inline-block;height:20px">Preview</label><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
    );
    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
    expect((await measure(page)).problems).toEqual([]);
  });

  it('does not audit controls inside collapsed details as visible targets', async () => {
    const page = await browser.newPage();
    await page.setContent(
      '<dialog aria-label="Settings"><details><summary style="min-height:30px">More</summary><input type="checkbox" aria-label="Hidden choice" style="width:12px;height:12px"></details><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
    );
    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
    expect((await measure(page)).problems).toEqual([]);
  });

  it('uses the configured phone width when mobile emulation expands the layout viewport', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.setContent(
      '<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{width:900px}</style><dialog aria-label="Test"><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
    );
    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
    expect((await measure(page)).problems.some((problem) => problem.startsWith('page scrolls sideways'))).toBe(true);
  });

  it('counts an explicitly associated checkbox label as its hit target', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent(
      '<dialog aria-label="Checklist"><input id="check" type="checkbox" style="width:12px;height:12px"><label for="check" style="display:inline-block;min-width:100px;min-height:30px">Check this</label><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
    );
    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
    expect((await measure(page)).problems).toEqual([]);
  });

  it('reports unnamed dialogs and undersized buttons', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent('<dialog><button aria-label="Close" style="width:12px;height:12px;padding:0;border:0">×</button></dialog>');
    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
    const result = await measure(page);
    expect(result.problems).toContain('dialog has no accessible name');
    expect(result.problems.some((problem) => problem.includes('target') && problem.includes('12x12'))).toBe(true);
  });
});
