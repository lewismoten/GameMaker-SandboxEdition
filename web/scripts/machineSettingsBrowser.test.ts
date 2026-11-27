// Exercise the real desk button, dialog and persisted hardware with bundled headless Chromium.
import { readFileSync } from 'node:fs';
import type { Browser } from 'playwright-core';
import { expect, inject, it } from 'vitest';
import { launch } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';

// Injected into the page before the accessibility scans.
declare const axe: typeof import('axe-core');

it('opens by keyboard, applies and remembers hardware, preserves TURBO, and fits both themes', async () => {
  let browser: Browser | undefined;
  try {
    browser = await launch();
    const freshDesk = await browser.newPage();
    await freshDesk.goto(`${inject('appBase')}/#/desk`, { waitUntil: 'commit' });
    await freshDesk.getByRole('button', { name: /^Machine settings, 66 MHz/ }).waitFor();
    // Capture the BIOS header as it is printed to the VGA canvas.
    await freshDesk.addScriptTag({
      type: 'module',
      content: `import { TextScreen } from '/src/retro/text/textScreen.ts';
        const print = TextScreen.prototype.print;
        TextScreen.prototype.print = function (text, attr) {
          if (text.startsWith('AwkWard Modular BIOS')) console.info(text);
          print.call(this, text, attr);
        };`,
    });
    const [post] = await Promise.all([
      freshDesk.waitForEvent('console', { predicate: (line) => line.text().startsWith('AwkWard Modular BIOS') }),
      freshDesk.getByRole('button', { name: 'Power', exact: true }).click(),
    ]);
    expect(post.text().split('\n')[1]).toBe('486DX2-66 Turbo');
    await freshDesk.close();
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
      await forceTheme(context, theme);
      const page = await context.newPage();
      await page.goto(`${inject('appBase')}/#/desk`, { waitUntil: 'commit' });
      const button = page.getByRole('button', { name: /^Machine settings, \d+ MHz/ });
      await button.waitFor();
      const dialog = page.getByRole('dialog', { name: 'Machine settings' });
      // The desk adds the clock speed to the button label after binding its controls.
      await button.press('Enter');
      await dialog.waitFor();
      await assertTheme(page, theme);
      await dialog.getByLabel('CPU', { exact: true }).selectOption('ps1');
      await dialog.getByLabel('Hard drive timing').selectOption('286');
      // drive sounds: one switch off, and the master switch holds the grid while it is off
      await dialog.getByLabel('CD-ROM heads sounds').uncheck();
      await dialog.getByLabel('All drive sounds').uncheck();
      expect(await dialog.getByLabel('Floppy spin sounds').isDisabled()).toBe(true);
      await dialog.getByLabel('All drive sounds').check();
      expect(await dialog.getByLabel('Floppy spin sounds').isDisabled()).toBe(false);
      await dialog.getByRole('button', { name: 'Apply' }).click();
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gm-desk-machine')!) as { sounds: Record<string, unknown> });
      expect(saved.sounds).toMatchObject({ all: true, cd: { spin: true, heads: false, rw: true }, hdd: { heads: true } });
      expect(await button.getAttribute('aria-label')).toContain('10 MHz');
      expect(await button.evaluate((b) => document.activeElement === b)).toBe(true);
      await page.getByRole('button', { name: 'Turbo', exact: true }).click();
      expect(await button.getAttribute('aria-label')).toContain('8 MHz');
      await page.getByRole('button', { name: 'Turbo', exact: true }).click();
      expect(await button.getAttribute('aria-label')).toContain('10 MHz');
      await page.reload();
      await button.waitFor();
      expect(await button.getAttribute('aria-label')).toContain('10 MHz');
      // Check real, scaled targets on desktop and phone; axe checks the new dialog and opener.
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        const rect = await button.boundingBox();
        expect(rect!.width).toBeGreaterThanOrEqual(24);
        expect(rect!.height).toBeGreaterThanOrEqual(24);
        await page.addScriptTag({ content: readFileSync('../node_modules/axe-core/axe.min.js', 'utf8') });
        const scan = await button.evaluate(async (element) => {
          const result = await axe.run(element, { elementRef: true });
          return {
            violations: result.violations.map((rule) => rule.id),
            openerNamed: result.passes.some((rule) => rule.id === 'button-name' && rule.nodes.some((node) => node.element === element)),
          };
        });
        expect(scan.violations).toEqual([]);
        expect(scan.openerNamed).toBe(true);
        await button.click();
        expect(await dialog.getByLabel('CPU', { exact: true }).inputValue()).toBe('ps1');
        expect(await dialog.getByLabel('Hard drive timing').inputValue()).toBe('286');
        expect(await dialog.getByLabel('CD-ROM heads sounds').isChecked()).toBe(false);
        expect(await dialog.getByLabel('Hard drive read/write sounds').isChecked()).toBe(true);
        const violations = await dialog.evaluate(async (element) => {
          return (await axe.run(element)).violations.map((rule) => rule.id);
        });
        expect(violations).toEqual([]);
        await dialog.getByLabel('CPU', { exact: true }).selectOption('486');
        await page.keyboard.press('Escape');
        expect(await button.getAttribute('aria-label')).toContain('10 MHz');
        expect(await button.evaluate((b) => document.activeElement === b)).toBe(true);
      }
      // The powered LED readout follows the choice and TURBO without rebooting.
      await page.getByRole('button', { name: 'Power', exact: true }).click();
      await page.locator('.mhz .seg-display[aria-label="10 MHz"]').waitFor({ timeout: 30000 });
      await page.getByRole('button', { name: 'Turbo', exact: true }).click();
      await page.locator('.mhz .seg-display[aria-label="8 MHz"]').waitFor();
      await context.close();
    }
  } finally {
    await browser?.close();
  }
}, 180000);
