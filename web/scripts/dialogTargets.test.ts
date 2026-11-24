// Render the actual dialog styles to guard minimum pointer targets without a catalog load.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import type { Browser } from 'playwright-core';
import { launch } from './perfLib';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 }); // a browser launch is slow on a busy machine
let browser: Browser;
beforeAll(async () => {
  browser = await launch();
});
afterAll(async () => {
  await browser?.close();
});

for (const fixture of [
  { id: 'save-info', file: 'src/saves/savesPanel.css', html: '<button class="sv-tip" aria-label="About the high scores">i</button>', target: '.sv-tip' },
]) {
  it(`${fixture.id} offers a 24px hit target`, async () => {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    try {
      await page.setContent(`<dialog class="modal" aria-label="Target fixture">${fixture.html}</dialog>`);
      await page.addStyleTag({ content: readFileSync('src/editor/shell/editor.css', 'utf8') + readFileSync(fixture.file, 'utf8') });
      await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
      const rect = await page.locator(fixture.target).boundingBox();
      expect(rect!.width).toBeGreaterThanOrEqual(24);
      expect(rect!.height).toBeGreaterThanOrEqual(24);
    } finally {
      await page.close();
    }
  });
}

it('keeps DOS player controls at least 44px tall in touch landscape', async () => {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true });
  try {
    const directions = ['left', 'up', 'down', 'right'];
    await page.setContent(`<dialog class="modal" open><div class="dp">
      <div class="dp-presets"><button>Preset</button></div>
      <div class="dp-preview"><div class="dp-row dp-move">
        <label class="dp-mini">Move<select><option>Frame</option></select></label>
        <div class="dp-row">${directions.map((d) => `<button class="dp-arrow" aria-label="Move ${d}">${d}</button>`).join('')}</div>
      </div></div>
    </div></dialog>`);
    for (const file of ['shell/editor.css', 'editors/integrator/dosPlayer/playerPanel.css', 'shell/dialogsPhone.css']) {
      await page.addStyleTag({ content: readFileSync(`src/editor/${file}`, 'utf8') });
    }
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    for (const control of [
      page.getByRole('button', { name: 'Preset' }),
      ...directions.map((d) => page.getByRole('button', { name: `Move ${d}` })),
      page.getByRole('combobox', { name: 'Move' }),
    ]) {
      const sizes = await control.evaluate((el) => [el.getBoundingClientRect().height, parseFloat(getComputedStyle(el).minHeight)]);
      expect.soft(Math.min(...sizes), `${String(control)} height and min-height: ${sizes.join(', ')}`).toBeGreaterThanOrEqual(44);
    }
  } finally {
    await page.close();
  }
});
