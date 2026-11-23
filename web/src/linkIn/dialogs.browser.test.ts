// Measure the download consent dialog with a long hostname in Chromium.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('wraps the requesting hostname at phone and desktop widths in both color schemes', async () => {
  const bundle = await build({
    entryPoints: ['src/linkIn/dialogs.ts'],
    outfile: 'dialogs.js',
    bundle: true,
    write: false,
    globalName: 'dialogs',
    format: 'iife',
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const file of bundle.outputFiles) {
      if (file.path.endsWith('.css')) await page.addStyleTag({ content: file.text });
      else await page.addScriptTag({ content: file.text });
    }
    const host = 'a'.repeat(60) + '.example.org';
    await page.addScriptTag({ content: `void dialogs.askToFetch(${JSON.stringify(host)})` });
    const dialog = page.getByRole('dialog', { name: 'Download a game from another site?' });
    expect(await dialog.locator('strong').innerText()).toBe(host);
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 640 });
        const [scrollWidth, clientWidth] = await dialog.evaluate((el) => [el.scrollWidth, el.clientWidth]);
        expect(scrollWidth, `${width}px in ${colorScheme}`).toBe(clientWidth);
      }
    }
  } finally {
    await browser.close();
  }
});
