// Render the actual dialog styles to guard minimum pointer targets without a catalog load.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { launch } from './perfLib';

for (const fixture of [
  { id: 'save-info', file: 'src/saves/savesPanel.css', html: '<button class="sv-tip" aria-label="About the high scores">i</button>', target: '.sv-tip' },
]) {
  it(`${fixture.id} offers a 24px hit target`, async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
      await page.setContent(`<dialog class="modal" aria-label="Target fixture">${fixture.html}</dialog>`);
      await page.addStyleTag({ content: readFileSync('src/editor/shell/editor.css', 'utf8') + readFileSync(fixture.file, 'utf8') });
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      const rect = await page.locator(fixture.target).boundingBox();
      expect(rect!.width).toBeGreaterThanOrEqual(24);
      expect(rect!.height).toBeGreaterThanOrEqual(24);
    } finally {
      await browser.close();
    }
  });
}
