// Browser regression for the shared dialog's accessible name and nested heading IDs.
import { describe, expect, it, vi } from 'vitest';
import { build } from 'esbuild';
import { launch } from './perfLib';

vi.setConfig({ testTimeout: 30_000 }); // esbuild bundle plus a browser launch, slow on a busy machine

describe('shared modal accessibility', () => {
  it('names each dialog with its own visible heading', async () => {
    const bundle = await build({ entryPoints: ['src/editor/core/ui.ts'], bundle: true, write: false, format: 'iife', globalName: 'ui' });
    const browser = await launch();
    try {
      const page = await browser.newPage();
      await page.setContent('<!doctype html><html lang="en"><title>Dialog test</title><body></body></html>');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      const names = await page.evaluate(() => {
        const api = (window as unknown as { ui: { modal: (title: string, build: () => string) => Promise<unknown> } }).ui;
        void api.modal('First dialog', () => 'First content');
        void api.modal('Second dialog', () => 'Second content');
        return [...document.querySelectorAll('dialog')].map((dialog) => {
          const id = dialog.getAttribute('aria-labelledby');
          return { id, text: id ? document.getElementById(id)?.textContent : null, ownsHeading: id ? dialog.contains(document.getElementById(id)) : false };
        });
      });
      expect(names.map((x) => x.text)).toEqual(['First dialog', 'Second dialog']);
      expect(names.every((x) => x.ownsHeading)).toBe(true);
      expect(new Set(names.map((x) => x.id)).size).toBe(2);
      await page.keyboard.press('Escape');
      await expect.poll(() => page.locator('dialog').count()).toBe(1);
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await expect.poll(() => page.locator('dialog').count()).toBe(0);
    } finally {
      await browser.close();
    }
  });
});
