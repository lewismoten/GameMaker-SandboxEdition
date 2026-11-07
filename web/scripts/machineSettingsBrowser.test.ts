// Exercise the real desk button, dialog and persisted hardware with bundled headless Chromium.
import { readFileSync } from 'node:fs';
import type { Browser } from 'playwright-core';
import { expect, it } from 'vitest';
import { launch, target } from './perfLib';
import { forceTheme } from './forceTheme';

it('opens by keyboard, applies and remembers hardware, preserves TURBO, and fits both themes', async () => {
  const server = await target(5198);
  let browser: Browser | undefined;
  try {
    browser = await launch();
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
      await forceTheme(context, theme);
      const page = await context.newPage();
      await page.goto(`${server.base}/#/desk`);
      const button = page.getByRole('button', { name: /^Machine settings/ });
      await button.waitFor();
      await button.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Machine settings' });
      await dialog.waitFor();
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
        await button.click();
        expect(await dialog.getByLabel('CPU', { exact: true }).inputValue()).toBe('ps1');
        expect(await dialog.getByLabel('Hard drive timing').inputValue()).toBe('286');
        expect(await dialog.getByLabel('CD-ROM heads sounds').isChecked()).toBe(false);
        expect(await dialog.getByLabel('Hard drive read/write sounds').isChecked()).toBe(true);
        await page.addScriptTag({ content: readFileSync('../node_modules/axe-core/axe.min.js', 'utf8') });
        const violations = await page.evaluate(async () => {
          // @ts-expect-error axe is injected above
          const result = await axe.run(document.querySelector('dialog[open]'));
          return result.violations.map((v: { id: string }) => v.id);
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
    try {
      await browser?.close();
    } finally {
      server.stop();
    }
  }
}, 90000);
