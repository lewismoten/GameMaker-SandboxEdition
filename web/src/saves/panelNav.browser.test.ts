// Check the visible discovery status in the compact Saves & scores navigation.
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('shows both tin heart states in a short window', async () => {
  const script = await build({ entryPoints: ['src/saves/panelNav.ts'], bundle: true, write: false, globalName: 'panelNav' });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    await page.setContent('<dialog open class="modal sv-dialog"><div class="sv"><nav class="sv-nav" data-list-area="slots"></nav></div></dialog>');
    await page.addStyleTag({ content: readFileSync('src/saves/savesPanel.css', 'utf8') });
    await page.addScriptTag({ content: script.outputFiles[0].text });
    for (const found of [false, true]) {
      await page.addScriptTag({
        content: `panelNav.renderNav({
        target: {saveId: 'game:blaster'}, backups: [], dirtyScores: () => false,
        saves: {slots: [], highScores: {entries: []}, files: ${found ? "{'tinheart.dat': new TextEncoder().encode(JSON.stringify({found:'2020-01-01'}))}" : '{}'}}
      }, document.querySelector('nav'))`,
      });
      expect.soft(await page.locator('.sv-nav-note').innerText()).toContain(found ? 'Found' : 'Not found yet');
    }
  } finally {
    await browser.close();
  }
});
