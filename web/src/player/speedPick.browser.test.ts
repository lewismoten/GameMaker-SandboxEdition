// Exercise native select changes with real keyboard input in Chromium.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('keeps focus on the speed picker through consecutive arrow presses until Tab moves on', async () => {
  const bundle = await build({
    entryPoints: ['src/player/speedPick.ts'],
    bundle: true,
    write: false,
    outfile: 'picker.js',
    globalName: 'picker',
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<div class="gm-corner"></div><canvas tabindex="0"></canvas>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.addScriptTag({ content: "picker.speedPick(document.querySelector('.gm-corner'), {}, document.querySelector('canvas'))" });
    const select = page.getByRole('combobox', { name: 'Run like a' });
    await page.keyboard.press('Tab');
    for (const preset of ['486', '386']) {
      await page.keyboard.press('ArrowDown');
      expect(await select.inputValue()).toBe(preset);
      expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);
    }
    await page.keyboard.press('Tab');
    expect(await page.locator('canvas:focus').count()).toBe(1);
  } finally {
    await browser.close();
  }
});
