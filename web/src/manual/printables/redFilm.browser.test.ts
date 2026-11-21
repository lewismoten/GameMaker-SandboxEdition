// Check the draggable film and its visible caption in Chromium's accessibility tree.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('exposes one named image for the film and its visible drag caption', async () => {
  const script = await build({ entryPoints: ['src/manual/printables/redFilm.ts'], bundle: true, write: false, format: 'iife', globalName: 'redFilm' });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addStyleTag({ path: 'src/manual/printables/paper.css' });
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await page.addScriptTag({ content: 'const film = new redFilm.RedFilm(); film.mount(document.body); film.show();' });
    const caption = page.getByText('RED FILM · drag me', { exact: true });
    expect(await caption.isVisible()).toBe(true);
    expect(await page.locator('.rf-film-caption').getAttribute('aria-hidden')).toBe('true');
    expect(await page.locator('body').ariaSnapshot()).toBe('- img "Red film (drag it over the answers)"');
  } finally {
    await browser.close();
  }
});
