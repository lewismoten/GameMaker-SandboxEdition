// Browser regressions for dialog names, geometry and minimum targets.
import { describe, expect, it } from 'vitest';
import { launch } from './perfLib';
import { measure } from './dialogsFitMeasure';

describe('dialog measurements', () => {
  it('keeps a full-size checkbox target when its separate caption is shorter', async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage();
      await page.setContent(
        '<dialog aria-label="Options"><input id="check" type="checkbox" style="width:24px;height:24px"><label for="check" style="display:inline-block;height:20px">Preview</label><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
      );
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      expect((await measure(page)).problems).toEqual([]);
    } finally {
      await browser.close();
    }
  });

  it('does not audit controls inside collapsed details as visible targets', async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage();
      await page.setContent(
        '<dialog aria-label="Settings"><details><summary style="min-height:30px">More</summary><input type="checkbox" aria-label="Hidden choice" style="width:12px;height:12px"></details><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
      );
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      expect((await measure(page)).problems).toEqual([]);
    } finally {
      await browser.close();
    }
  });

  it('uses the configured phone width when mobile emulation expands the layout viewport', async () => {
    const browser = await launch();
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.setContent(
        '<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{width:900px}</style><dialog aria-label="Test"><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
      );
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      expect((await measure(page)).problems.some((problem) => problem.startsWith('page scrolls sideways'))).toBe(true);
    } finally {
      await browser.close();
    }
  });

  it('counts an explicitly associated checkbox label as its hit target', async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.setContent(
        '<dialog aria-label="Checklist"><input id="check" type="checkbox" style="width:12px;height:12px"><label for="check" style="display:inline-block;min-width:100px;min-height:30px">Check this</label><button aria-label="Close" style="width:30px;height:30px">×</button></dialog>',
      );
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      expect((await measure(page)).problems).toEqual([]);
    } finally {
      await browser.close();
    }
  });

  it('reports unnamed dialogs and undersized buttons', async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.setContent('<dialog><button aria-label="Close" style="width:12px;height:12px;padding:0;border:0">×</button></dialog>');
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      const result = await measure(page);
      expect(result.problems).toContain('dialog has no accessible name');
      expect(result.problems.some((problem) => problem.includes('target') && problem.includes('12x12'))).toBe(true);
    } finally {
      await browser.close();
    }
  });
});
